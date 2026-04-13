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
        
        const resParams = await fetch("http://localhost:8888/api/config/params", { headers });
        console.log("STATUS:", resParams.status);
        console.log("PAYLOAD:", await resParams.text());
        
    } catch(e) {
        console.error(e);
    }
}
test();
