import api from "./api";
import type { Job } from "../types/job";

export async function getJobs(): Promise<Job[]> {
    const response = await api.get<Job[]>(`/job/`);
    return response.data;
}

export async function getJobById(id: number): Promise<Job> {
    const response = await api.get<Job>(`/job/${id}`);
    return response.data;
}

export async function createJob(job: Job): Promise<Job> {
    const response = await api.post<Job>(`/job/`, job);
    return response.data;
}

export async function updateJob(id: number, job: Job): Promise<Job> {
    const response = await api.put<Job>(`/job/${id}`, job);
    return response.data;
}

export async function deleteJob(id: string): Promise<void> {
    const response = await api.delete(`/job/${id}`);
    return response.data;
}
