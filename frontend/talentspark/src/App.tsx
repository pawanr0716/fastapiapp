// import Welcome from "./components/Welcome";
import NavBar from "./Components/NavBar";
import CompanyCard from "./Components/CompanyCard";
import JobCard from "./Components/JobCard";
import Footer from "./Components/footer";
import {useEffect,useState} from "react";
import { getCompanies,updateCompany,deleteCompany,createCompany } from "./Services/CompanyService";
import type {Company} from "./types/company"

function App(){
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<Error | null>(null)
  const [companies,setCompanies] = useState<Company[]>([]);

  async function fetchCompanies() {
    setLoading(true);
    try {
      const company = await getCompanies();
      setCompanies(company);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
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


  useEffect(() => {
    fetchCompanies();
  }, []);
  
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
    <br />
    <CompanyCard 
    companies={companies}
    onedit={handleEdit}
    ondelete={handleDelete}
    onadd={handleAdd}
    />
    <JobCard />
    <Footer />
    </>
  )
}

export default App