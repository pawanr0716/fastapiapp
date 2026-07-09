import api from "./api";
import type { Company } from "../types/company";

export async function getCompanies(): Promise<Company[]> {
  const response = await api.get<Company[]>("/company/");
  return response.data;
}

export async function getCompanyById(id: number): Promise<Company> {
  const response = await api.get<Company>(`/company/${id}`);
  return response.data;
}

export async function createCompany(company: Company, idempotencyKey?: string): Promise<Company> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await api.post<Company>("/company/", company, {
    headers,
  });
  return response.data;
}

export async function updateCompany(id: number, company: Company): Promise<Company> {
  const response = await api.put<Company>(`/company/${id}`, company);
  return response.data;
}

export async function deleteCompany(id: number): Promise<void> {
  const response = await api.delete(`/company/${id}`);
  // treat 200 or 204 as success
  if (response.status === 200 || response.status === 204) return;
  throw new Error(`Delete failed with status ${response.status}`);
}