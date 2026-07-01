import axios from "axios";
import type { Job } from "../types/job";

const API_BASE_URL = "http://localhost:8000";

export async function getJobs(): Promise<void> {
    const response = await axios.get<void>(`${API_BASE_URL}/job`);
    return response.data;
}

export async function getJobById(id: number): Promise<void> {
    const response = await axios.get<void>(`${API_BASE_URL}/job/${id}`);
    return response.data;
}

export async function createJob(job: Job): Promise<void> {
    const response = await axios.post<void>(`${API_BASE_URL}/job`, job);
    return response.data;
}

export async function updateJob(id: number, job: Job): Promise<void> {
    const response = await axios.put<void>(`${API_BASE_URL}/job/${id}`, job);
    return response.data;
}

export async function deleteJob(id: string): Promise<void> {
    const response = await axios.delete(`${API_BASE_URL}/job/${id}`);
    return response.data;
}
