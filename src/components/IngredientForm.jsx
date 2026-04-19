import { useState, useRef, useEffect, useCallback } from 'react';
import { CATEGORIES, UNITS } from '../context/InventoryContext';

/**
 * IngredientForm — Add or edit an ingredient.
 * Uses useRef for auto-focus on mount.
 * Props:
 *   - onSubmit(data) — called with form data
 *   - onCancel() — called to close form
 *   - initialData — for editing an existing item (optional)
 */
export default function IngredientForm({ onSubmit, onCancel, initialData = null }) {
  const nameRef = useRef(null);
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    quantity: initialData?.quantity || '',
    unit: initialData?.unit || 'pcs',
    category: initialData?.category || 'vegetables',
    expiryDate: initialData?.expiryDate || '',
  });

  const [errors, setErrors] = useState({});

  // useRef: Auto-focus the name input on mount
  useEffect(() => {
    if (nameRef.current) {
      nameRef.current.focus();
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      category: formData.category,
      expiryDate: formData.expiryDate,
    });
  }, [formData, validate, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="ingredient-form" id="ingredient-form">
      <div className="form-group">
        <label className="form-label" htmlFor="ingredient-name">Ingredient Name</label>
        <input
          ref={nameRef}
          type="text"
          id="ingredient-name"
          name="name"
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="e.g. Chicken Breast, Tomatoes..."
          value={formData.name}
          onChange={handleChange}
          autoComplete="off"
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="ingredient-quantity">Quantity</label>
          <input
            type="number"
            id="ingredient-quantity"
            name="quantity"
            className={`form-input ${errors.quantity ? 'error' : ''}`}
            placeholder="e.g. 2"
            value={formData.quantity}
            onChange={handleChange}
            step="0.1"
            min="0.1"
          />
          {errors.quantity && <span className="form-error">{errors.quantity}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ingredient-unit">Unit</label>
          <select
            id="ingredient-unit"
            name="unit"
            className="form-select"
            value={formData.unit}
            onChange={handleChange}
          >
            {UNITS.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="ingredient-category">Category</label>
        <select
          id="ingredient-category"
          name="category"
          className="form-select"
          value={formData.category}
          onChange={handleChange}
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="ingredient-expiry">Expiry Date</label>
        <input
          type="date"
          id="ingredient-expiry"
          name="expiryDate"
          className={`form-input ${errors.expiryDate ? 'error' : ''}`}
          value={formData.expiryDate}
          onChange={handleChange}
        />
        {errors.expiryDate && <span className="form-error">{errors.expiryDate}</span>}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} id="form-cancel-btn">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" id="form-submit-btn">
          {isEditing ? '✏️ Update Item' : '➕ Add to Inventory'}
        </button>
      </div>
    </form>
  );
}
