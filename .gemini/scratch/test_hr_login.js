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
        console.log("LOGIN SUCCESS: ", loginData.roles);
        
        const token = loginData.accessToken || loginData.token;
        
        const permsRes = await fetch("http://localhost:8888/api/auth/my-permissions", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const permsData = await permsRes.json();
        console.log("PERMISSIONS: ", permsData);
    } catch(e) {
        console.error("ERROR: ", e);
    }
}
test();
