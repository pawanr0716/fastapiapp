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

export async function createCompany(company: Company): Promise<Company> {
  const response = await api.post<Company>("/company/", company);
  return response.data;
}

export async function updateCompany(id: number, company: Company): Promise<Company> {
  const response = await api.put<Company>(`/company/${id}`, company);
  return response.data;
}

export async function deleteCompany(id: number): Promise<void> {
  const response = await api.delete(`/company/${id}`);
  return response.data;
}