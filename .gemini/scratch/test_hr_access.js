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
        
        let url = "http://localhost:8888/api/employees?page=0&size=20";
        console.log("Fetching: " + url);
        const empRes = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!empRes.ok) {
            console.error("HTTP ERROR: ", empRes.status);
            const text = await empRes.text();
            console.error("TEXT: ", text);
        } else {
            const data = await empRes.json();
            console.log("EMPLOYEES: ", data.totalElements, "items");
        }
    } catch(e) {
        console.error("ERROR: ", e);
    }
}
test();
