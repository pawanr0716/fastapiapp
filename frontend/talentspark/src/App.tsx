// import Welcome from "./components/Welcome";
import NavBar from "./components/NavBar";
import CompanyCard from "./components/CompanyCard";
import JobCard from "./components/JobCard";
import Footer from "./components/footer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import {useEffect,useState} from "react";
import { getCompanies,updateCompany,deleteCompany,createCompany } from "./Services/CompanyService";
import { getJobs, createJob, updateJob, deleteJob } from "./Services/JobServices";
import type {Company} from "./types/company"
import type { Job } from "./types/job";

function App(){
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<Error | null>(null)
  const [companies,setCompanies] = useState<Company[]>([]);
  const [jobs,setJobs] = useState<Job[]>([]);
  const [token,setToken] = useState<string | null>(localStorage.getItem("token"));
  const [showRegister,setShowRegister] = useState(false);

  async function fetchCompanies() {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const company = await getCompanies();
      setCompanies(company);
      setError(null);
    } catch (err) {
      console.error("Failed to load companies:", err);
      setCompanies([]);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchJobs() {
    if (!token) {
      return;
    }

    try {
      const jobList = await getJobs();
      setJobs(jobList);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setJobs([]);
      setError(err as Error);
    }
  }

  async function handleLogin(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setShowRegister(false);
  }

  function handleSwitchToRegister() {
    setShowRegister(true);
    setError(null);
  }

  function handleSwitchToLogin() {
    setShowRegister(false);
    setError(null);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setCompanies([]);
    setError(null);
  }

  async function handleEdit(company:Company){
    try{
      const updatedCompany = await updateCompany(company.id,company);
      setCompanies(companies.map((company) => company.id === updatedCompany.id ? updatedCompany : company));
    }catch(err){
      setError(err as Error);
    }
  }

  async function handleDelete(id:number){
    try{
      await deleteCompany(id);
      setCompanies(companies.filter((company) => company.id !== id));
    }catch(err){
      setError(err as Error);
    }
  }

  async function handleAdd(company:Company){
    try{
      const newCompany = await createCompany(company);
      setCompanies([...companies,newCompany]);
    }catch(err){
      setError(err as Error);
    }
  }

  async function handleAddJob(job: Job) {
    try {
      const newJob = await createJob(job);
      setJobs([...jobs, newJob]);
    } catch (err) {
      setError(err as Error);
    }
  }

  async function handleEditJob(job: Job) {
    try {
      const updatedJob = await updateJob(job.id, job);
      setJobs(jobs.map((j) => j.id === updatedJob.id ? updatedJob : j));
    } catch (err) {
      setError(err as Error);
    }
  }

  async function handleDeleteJob(id: number) {
    try {
      await deleteJob(String(id));
      setJobs(jobs.filter((job) => job.id !== id));
    } catch (err) {
      setError(err as Error);
    }
  }

  useEffect(() => {
    fetchCompanies();
    fetchJobs();
  }, [token]);
  
  if (!token) {
    return showRegister ? (
      <Register onSwitchToLogin={handleSwitchToLogin} />
    ) : (
      <Login onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} />
    );
  }

  if(loading){
    return <div>Loading...</div>
  }

  if(error){
    return <div>Error: {error.message}</div>
  }
  
  return(
    <>
    <NavBar />
    {/* <Welcome /> */}
    <button onClick={handleLogout}>Logout</button>
    <br />
    <CompanyCard 
    companies={companies}
    onedit={handleEdit}
    ondelete={handleDelete}
    onadd={handleAdd}
    />
    <JobCard jobs={jobs} companies={companies} onAdd={handleAddJob} onEdit={handleEditJob} onDelete={handleDeleteJob} />
    <Footer />
    </>
  )
}

export default App