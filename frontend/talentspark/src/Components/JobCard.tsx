import { useState } from "react";
import type { Job } from "../types/job";
import type { Company } from "../types/company";

type Props = {
    jobs: Job[];
    companies: Company[];
    onAdd: (job: Job) => void;
};

function JobCard({ jobs, companies, onAdd }: Props) {
    const [jobForm, setJobForm] = useState<Job>({
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

    return (
        <div>
            <h2>Jobs</h2>
            {jobs.length === 0 ? (
                <p>No jobs available.</p>
            ) : (
                jobs.map((job) => (
                    <div key={job.id} style={{ border: "1px solid #ccc", margin: "8px 0", padding: "8px" }}>
                        <h3>{job.Title}</h3>
                        <p>{job.description}</p>
                        <p>Salary: {job.salary}</p>
                        <p>Company ID: {job.company_id}</p>
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