const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post("http://localhost:8888/api/auth/login", {
            username: "nhansu",
            password: "123456"
        });
        const token = loginRes.data.accessToken || loginRes.data.token;
        const auth = { headers: { Authorization: `Bearer ${token}` } };
        
        const nextIdRes = await axios.get("http://localhost:8888/api/employees/next-id", auth);
        console.log("NEXT ID:", nextIdRes.data);
        
        const createRes = await axios.post("http://localhost:8888/api/employees", {
            id: nextIdRes.data,
            fullName: "Test employee",
            dob: "1990-01-01",
            employeeType: "FULL_TIME",
            contractSalary: 10000000,
            active: true
        }, auth);
        console.log("CREATED:", createRes.status);
    } catch(e) {
        console.error("ERROR:");
        console.error(e.response ? e.response.status + " " + e.response.data : e.message);
    }
}
test();
