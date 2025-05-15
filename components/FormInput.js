// Reusable form input component with validation support
export default function FormInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  className = '',
  rows = 4
}) {
  // Format field label by converting snake_case to Title Case
  const formattedLabel = label || name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Determine which input type to render
  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          id={id || name}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={`form-input ${error ? 'border-red-500' : ''} ${className}`}
        />
      );
    } else if (type === 'color') {
      return (
        <div className="flex items-center">
          <input
            id={id || name}
            name={name}
            type="color"
            value={value || '#000000'}
            onChange={onChange}
            required={required}
            className={`h-10 w-10 mr-2 ${className}`}
          />
          <input
            type="text"
            value={value || ''}
            onChange={onChange}
            name={name}
            placeholder={placeholder}
            className={`form-input ${error ? 'border-red-500' : ''}`}
          />
        </div>
      );
    } else {
      return (
        <input
          id={id || name}
          name={name}
          type={type}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`form-input ${error ? 'border-red-500' : ''} ${className}`}
        />
      );
    }
  };

  return (
    <div className="mb-4">
      <label className="form-label" htmlFor={id || name}>
        {formattedLabel}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
