import type { Company } from "../types/company";
type Props = {
    companies: Company[];
};
function CompanyCard({ companies }: Props) {
    // const [companies, setCompanies] = useState<Company[]>([]);
    // async function fetchCompanies() {
    //     const data = await getCompanies();
    //     setCompanies(data);
    // }
    // useEffect(() => {
    //     fetchCompanies();
    // }, []);
    return (
        <div>
            {companies.map((company) => (
                <div key={company.id}>
                    <h2>{company.name}</h2>
                    <p>Email:{company.email}</p>
                    <p>Phone:{company.phone}</p>
                    <p>Location:{company.location}</p>
                    <hr></hr>
                </div>
            ))}
        </div>
    )
}

export default CompanyCard;