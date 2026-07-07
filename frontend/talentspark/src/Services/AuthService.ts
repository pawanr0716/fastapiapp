import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "../types/user";
import axios from "axios";
import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/auth`;

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const normalizedUsername = credentials.email.trim().toLowerCase();
  // Backend expects OAuth2PasswordRequestForm (form-encoded with "username" field)
  const formData = new URLSearchParams();
  formData.append("grant_type", "password");
  formData.append("username", normalizedUsername);
  formData.append("password", credentials.password);
  console.log("DEBUG AuthService.login", normalizedUsername);

  const response = await axios.post<LoginResponse>(`${API_URL}/login`, formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  console.log("DEBUG AuthService.login response", response.status, response.data);
  return response.data;
};

export const register = async (user: RegisterRequest): Promise<RegisterResponse> => {
  const payload = {
    name: user.name.trim(),
    email: user.email.trim().toLowerCase(),
    password: user.password,
    role: user.role.trim(),
  };
  console.log("DEBUG AuthService.register", payload);
  const response = await axios.post<RegisterResponse>(`${API_URL}/register`, payload);
  return response.data;
};