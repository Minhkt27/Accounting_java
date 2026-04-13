async function test() {
    try {
        const loginRes = await fetch("http://localhost:8888/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "nhansu",
                password: "123456"
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.token;
        const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
        
        const nextIdRes = await fetch("http://localhost:8888/api/employees/next-id", { headers });
        const nextId = await nextIdRes.text();
        console.log("NEXT ID:", nextId);
        
        const createRes = await fetch("http://localhost:8888/api/employees", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                id: nextId,
                fullName: "Test employee hr",
                dob: "1990-01-01",
                employeeType: "FULL_TIME",
                contractSalary: 10000000,
                active: true,
                department: "Nhân sự",
                email: "test@domain.com",
                phone: "0123456789",
                hometown: "Hanoi"
            })
        });
        
        if (createRes.ok) {
            console.log("CREATED SUCCESS:", createRes.status);
        } else {
            console.log("CREATE FAILED:", createRes.status, await createRes.text());
        }
    } catch(e) {
        console.error("ERROR:");
        console.error(e);
    }
}
test();
