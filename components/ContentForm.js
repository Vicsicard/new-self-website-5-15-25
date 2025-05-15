import { useState } from 'react';

// Reusable form component for content editing
export default function ContentForm({ initialData, onSubmit, disabled, children }) {
  const [formData, setFormData] = useState(initialData || {});
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form fields are rendered by the parent component */}
      {children}
      
      <div className="mt-6">
        <button
          type="submit"
          disabled={disabled}
          className={`btn btn-primary ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {disabled ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
