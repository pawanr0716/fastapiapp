import { useState } from "react";
import type { Job } from "../types/job";
import type { Company } from "../types/company";

type Props = {
    jobs: Job[];
    companies: Company[];
    onAdd: (job: Job) => void;
    onEdit: (job: Job) => void;
    onDelete: (id: number) => void;
};

function JobCard({ jobs, companies, onAdd, onEdit, onDelete }: Props) {
    const [editJobId, setEditJobId] = useState<number | null>(null);
    const [jobForm, setJobForm] = useState<Job>({
        id: 0,
        Title: "",
        description: "",
        salary: "",
        company_id: companies.length > 0 ? companies[0].id : 0,
    });
    const [editForm, setEditForm] = useState<Job>({
        id: 0,
        Title: "",
        description: "",
        salary: "",
        company_id: companies.length > 0 ? companies[0].id : 0,
    });

    const handleAdd = () => {
        onAdd(jobForm);
        setJobForm({
            id: 0,
            Title: "",
            description: "",
            salary: "",
            company_id: companies.length > 0 ? companies[0].id : 0,
        });
    };

    const handleEdit = (job: Job) => {
        setEditJobId(job.id);
        setEditForm(job);
    };

    const handleSave = () => {
        onEdit(editForm);
        setEditJobId(null);
        setEditForm({
            id: 0,
            Title: "",
            description: "",
            salary: "",
            company_id: companies.length > 0 ? companies[0].id : 0,
        });
    };

    const handleCancel = () => {
        setEditJobId(null);
        setEditForm({
            id: 0,
            Title: "",
            description: "",
            salary: "",
            company_id: companies.length > 0 ? companies[0].id : 0,
        });
    };

    return (
        <div>
            <h2>Jobs</h2>
            {jobs.length === 0 ? (
                <p>No jobs available.</p>
            ) : (
                jobs.map((job) => (
                    <div key={job.id} style={{ border: "1px solid #ccc", margin: "8px 0", padding: "8px" }}>
                        {editJobId === job.id ? (
                            <>
                                <input
                                    type="text"
                                    value={editForm.Title}
                                    onChange={(e) => setEditForm({ ...editForm, Title: e.target.value })}
                                    placeholder={job.Title}
                                />
                                <input
                                    type="text"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder={job.description}
                                />
                                <input
                                    type="text"
                                    value={editForm.salary}
                                    onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                                    placeholder={job.salary}
                                />
                                <select
                                    value={editForm.company_id}
                                    onChange={(e) => setEditForm({ ...editForm, company_id: Number(e.target.value) })}
                                >
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                                <button onClick={handleSave}>Save</button>
                                <button onClick={handleCancel}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <h3>{job.Title}</h3>
                                <p>{job.description}</p>
                                <p>Salary: {job.salary}</p>
                                <p>Company ID: {job.company_id}</p>
                                <button onClick={() => handleEdit(job)}>Edit</button>
                                <button onClick={() => onDelete(job.id)}>Delete</button>
                            </>
                        )}
                    </div>
                ))
            )}

            <h3>Add Job</h3>
            <input
                type="text"
                value={jobForm.Title}
                onChange={(e) => setJobForm({ ...jobForm, Title: e.target.value })}
                placeholder="Title"
            />
            <input
                type="text"
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                placeholder="Description"
            />
            <input
                type="text"
                value={jobForm.salary}
                onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                placeholder="Salary"
            />
            <select
                value={jobForm.company_id}
                onChange={(e) => setJobForm({ ...jobForm, company_id: Number(e.target.value) })}
            >
                {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                        {company.name}
                    </option>
                ))}
            </select>
            <button onClick={handleAdd}>Add Job</button>
        </div>
    );
}

export default JobCard