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
        const headers = { "Authorization": `Bearer ${token}` };
        
        const res1 = await fetch("http://localhost:8888/api/employees", { headers });
        const data1 = await res1.json();
        console.log("EMPLOYEES keys:", Object.keys(data1));
        
        const res2 = await fetch("http://localhost:8888/api/attendance/4/2026", { headers });
        const data2 = await res2.json();
        console.log("ATTENDANCE keys:", Object.keys(data2));
    } catch(e) {
        console.error(e);
    }
}
test();
