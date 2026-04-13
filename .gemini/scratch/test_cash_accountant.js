async function test() {
    try {
        const loginRes = await fetch("http://localhost:8888/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "ketoan_tien",
                password: "123456"
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.token;
        const headers = { "Authorization": `Bearer ${token}` };
        
        let resP = await fetch("http://localhost:8888/api/payroll/3/2026?size=10000", { headers });
        console.log("PAYROLL STATUS:", resP.status);
        
        let resV = await fetch("http://localhost:8888/api/accounting/vouchers?month=3&year=2026", { headers });
        console.log("VOUCHER STATUS:", resV.status);
        
    } catch(e) {
        console.error(e);
    }
}
test();
