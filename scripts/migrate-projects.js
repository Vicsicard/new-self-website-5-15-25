// Script to migrate projects from an old database to the new one
require('dotenv').config();
const { MongoClient } = require('mongodb');

// Connection strings
// Using the new user credentials you provided
const SOURCE_DB_URI = 'mongodb+srv://vicsicard3:Jerrygarcia1993@cluster0.9uspndx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const TARGET_DB_URI = process.env.MONGODB_URI;

// Database and collection names
const SOURCE_DB_NAME = 'selfcast'; // Update this if your old DB has a different name
const SOURCE_COLLECTION = 'projects'; 
const TARGET_DB_NAME = process.env.MONGODB_DB;
const TARGET_COLLECTION = 'projects';

// Function to analyze the structure of a document
function analyzeStructure(doc, prefix = '') {
  const structure = {};
  
  for (const key in doc) {
    if (key === '_id') continue; // Skip MongoDB's internal _id field
    
    const value = doc[key];
    const type = Array.isArray(value) ? 'array' : typeof value;
    
    if (type === 'object' && value !== null) {
      if (value instanceof Date) {
        structure[key] = 'date';
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          const sampleItem = value[0];
          const itemType = typeof sampleItem;
          
          if (itemType === 'object' && sampleItem !== null && !(sampleItem instanceof Date)) {
            structure[key] = `array of objects`;
          } else {
            structure[key] = `array of ${itemType}s`;
          }
        } else {
          structure[key] = 'empty array';
        }
      } else {
        structure[key] = analyzeStructure(value, `${prefix}${key}.`);
      }
    } else {
      structure[key] = type;
    }
  }
  
  return structure;
}

async function compareCollections(sourceCollection, targetCollection) {
  // Get a sample document from each collection
  const sourceSample = await sourceCollection.findOne({});
  const targetSample = await targetCollection.findOne({});
  
  if (!sourceSample) {
    console.log('Source collection is empty');
    return { compatible: false };
  }
  
  if (!targetSample) {
    console.log('Target collection is empty - will use source structure');
    return { compatible: true, sourceStructure: analyzeStructure(sourceSample) };
  }
  
  // Analyze the structure of both documents
  const sourceStructure = analyzeStructure(sourceSample);
  const targetStructure = analyzeStructure(targetSample);
  
  console.log('\nSource Collection Structure:');
  console.log(JSON.stringify(sourceStructure, null, 2));
  
  console.log('\nTarget Collection Structure:');
  console.log(JSON.stringify(targetStructure, null, 2));
  
  // Compare the structures
  const differences = {};
  let compatible = true;
  
  // Check for fields in source that are missing in target
  for (const key in sourceStructure) {
    if (!targetStructure.hasOwnProperty(key)) {
      differences[key] = { issue: 'missing in target', sourceType: sourceStructure[key] };
      // Missing fields can be added, so not necessarily incompatible
    }
  }
  
  // Check for fields in target that are missing in source
  for (const key in targetStructure) {
    if (!sourceStructure.hasOwnProperty(key)) {
      differences[key] = { issue: 'missing in source', targetType: targetStructure[key] };
      // This might be a required field in the new schema
      if (key === 'projectId' || key === 'name' || key === 'content') {
        compatible = false;
      }
    }
  }
  
  // Check for type mismatches in common fields
  for (const key in sourceStructure) {
    if (targetStructure.hasOwnProperty(key) && 
        JSON.stringify(sourceStructure[key]) !== JSON.stringify(targetStructure[key])) {
      differences[key] = { 
        issue: 'type mismatch', 
        sourceType: sourceStructure[key], 
        targetType: targetStructure[key] 
      };
      // Type mismatches might require transformation
    }
  }
  
  return { compatible, differences, sourceStructure, targetStructure };
}

async function migrateProjects() {
  
  // Source database connection
  const sourceClient = new MongoClient(SOURCE_DB_URI);
  
  // Target database connection
  const targetClient = new MongoClient(TARGET_DB_URI);
  
  try {
    // Connect to both databases
    await sourceClient.connect();
    console.log('Connected to source database');
    
    await targetClient.connect();
    console.log('Connected to target database');
    
    // Get references to the databases and collections
    const sourceDb = sourceClient.db(SOURCE_DB_NAME);
    const sourceCollection = sourceDb.collection(SOURCE_COLLECTION);
    
    const targetDb = targetClient.db(TARGET_DB_NAME);
    const targetCollection = targetDb.collection(TARGET_COLLECTION);
    
    // First, compare the collection structures
    console.log('Comparing database structures...');
    const comparison = await compareCollections(sourceCollection, targetCollection);
    
    if (Object.keys(comparison.differences || {}).length > 0) {
      console.log('\nStructure differences found:');
      console.log(JSON.stringify(comparison.differences, null, 2));
    } else {
      console.log('\nNo structure differences found. Collections are compatible.');
    }
    
    if (!comparison.compatible) {
      console.log('\nWARNING: Collections are not fully compatible. Migration may require manual adjustments.');
      // Ask for confirmation to continue
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to continue with the migration? (yes/no): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Migration aborted by user.');
        return;
      }
    }
    
    // Get all projects from the source database
    const projects = await sourceCollection.find({}).toArray();
    console.log(`\nFound ${projects.length} projects in the source database`);
    
    // Process each project to match the new schema if needed
    const processedProjects = projects.map(project => {
      // Create a new object with the required fields for the target schema
      // This transformation is based on the comparison results
      const processed = {
        // Ensure required fields exist
        projectId: project.projectId || project._id.toString(),
        name: project.name || project.title || 'Untitled Project',
        content: project.content || {},
        createdAt: project.createdAt || new Date(),
        updatedAt: project.updatedAt || new Date()
      };
      
      // Copy all other fields from the source project
      // This ensures we don't lose any data that might be useful
      for (const key in project) {
        // Skip fields we've already handled and the MongoDB _id
        if (!['_id', 'projectId', 'name', 'content', 'createdAt', 'updatedAt'].includes(key)) {
          processed[key] = project[key];
        }
      }
      
      return processed;
    });
    
    // Check if any projects already exist in the target database to avoid duplicates
    const existingProjectIds = await targetCollection
      .find({}, { projection: { projectId: 1 } })
      .toArray()
      .then(docs => docs.map(doc => doc.projectId));
    
    console.log(`Found ${existingProjectIds.length} existing projects in the target database`);
    
    // Filter out projects that already exist
    const newProjects = processedProjects.filter(project => 
      !existingProjectIds.includes(project.projectId)
    );
    
    console.log(`Migrating ${newProjects.length} new projects`);
    
    // Insert the new projects
    if (newProjects.length > 0) {
      const result = await targetCollection.insertMany(newProjects);
      console.log(`Successfully migrated ${result.insertedCount} projects`);
    } else {
      console.log('No new projects to migrate');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the connections
    await sourceClient.close();
    console.log('Source database connection closed');
    
    await targetClient.close();
    console.log('Target database connection closed');
  }
}

// Run the migration
migrateProjects().catch(console.error);
