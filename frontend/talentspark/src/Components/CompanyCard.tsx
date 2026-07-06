import type { Company } from "../types/company";
import { useState } from "react";

type Props = {
  companies: Company[];
  onedit: (company: Company) => void;
  ondelete: (id: number) => void;
  onadd: (company: Company) => void;
};

function CompanyCard({ companies, onadd, onedit, ondelete }: Props) {
  const [editCompanyId, setEditCompanyId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState<Company>({
    id: 0,
    name: "",
    email: "",
    phone: "",
    location: "",
    jobs: [],
  });
  const [editForm, setEditForm] = useState<Company>({
    id: 0,
    name: "",
    email: "",
    phone: "",
    location: "",
    jobs: [],
  });

  const handleAdd = () => {
    onadd(addForm);
    setAddForm({
      id: 0,
      name: "",
      email: "",
      phone: "",
      location: "",
      jobs: [],
    });
  };

  const handleSave = () => {
    onedit(editForm);
    setEditForm({
      id: 0,
      name: "",
      email: "",
      phone: "",
      location: "",
      jobs: [],
    });
  };

  const handleCancel = () => {
    setEditCompanyId(null);
    setEditForm({
      id: 0,
      name: "",
      email: "",
      phone: "",
      location: "",
      jobs: [],
    });
  };

  return (
    <div className="section-card fade-in">
      <h2>Companies</h2>
      <div className="company-list">
        {companies.map((company) => (
          <div key={company.id} className="company-item">
            {editCompanyId === company.id ? (
              <>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder={company.name}
                />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder={company.email}
                />
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder={company.phone}
                />
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder={company.location}
                />
                <div className="company-actions">
                  <button className="edit-btn" onClick={handleSave}>
                    Save
                  </button>
                  <button className="delete-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>{company.name}</h3>
                <p>Email: {company.email}</p>
                <p>Phone: {company.phone}</p>
                <p>Location: {company.location}</p>
                <div className="company-actions">
                  <button className="edit-btn" onClick={() => setEditCompanyId(company.id)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => ondelete(company.id)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="add-form">
        <h3>Add New Company</h3>
        <div className="form-row">
          <input
            type="text"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            placeholder="Company Name"
          />
          <input
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            placeholder="Email"
          />
          <input
            type="tel"
            value={addForm.phone}
            onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
            placeholder="Phone"
          />
          <input
            type="text"
            value={addForm.location}
            onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
            placeholder="Location"
          />
        </div>
        <button className="add-btn" onClick={handleAdd}>
          Add Company
        </button>
      </div>
    </div>
  );
}

export default CompanyCard;