# 📋 PULSE Project - Interview Questions

A comprehensive list of potential interview questions based on the **Cold Chain Warehouse Monitoring System** project.

---

## 🏗️ Architecture & System Design

1. **Explain the overall architecture of your Cold Chain Monitoring System.**
   - *Expected Topics: Next.js backend, React frontend, Modbus TCP/IP integration, Google Sheets logging, real-time polling*

2. **Why did you choose Next.js for this project instead of a traditional MERN or Spring Boot stack?**
   - *Hint: API routes, SSR capabilities, React integration, faster development*

3. **How does your system communicate with PLCs? Explain the Modbus TCP/IP protocol.**
   - *Expected: Master-slave communication, coil reading, TCP port 502, holding registers vs coils*
   - *My system uses Modbus TCP/IP to communicate with Siemens PLCs over Ethernet. The Next.js backend acts as a Modbus Master, connecting to the PLC on port 502, switching between slave IDs for different rooms, and reading coil registers that represent boolean sensor states like panic buttons and door sensors. The modbus-serial npm library handles the low-level protocol, and I've implemented a singleton pattern with automatic reconnection for reliability.*

4. **Why did you use in-memory caching (`global.monitorState`) instead of Redis or a database?**
   - *Discuss: Trade-offs, when Redis would be better, serverless limitations*

5. **How would you scale this system to support 100+ warehouses?**
   - *Topics: Database migration, message queues, microservices, load balancing*
   - *To scale this system to 100+ warehouses, I would transition from direct polling to an event-driven architecture using MQTT. I'd deploy Edge Gateways at each site to push data to a central Kafka cluster. For storage, I’d replace Google Sheets with a Time-Series Database like InfluxDB to handle the high volume of sensor logs. This would allow us to decouple data collection from display, ensuring that the system remains responsive even with thousands of concurrent monitoring points.*

---

## 💻 Technical Implementation

### React & Next.js

6. **Explain the `useState` and `useEffect` hooks used in `WarehouseDashboard.jsx`.**
   - *Focus: State management, side effects, cleanup functions, dependency arrays*

7. **How do you handle real-time data updates in the dashboard?**
   - *Answer: Polling with `setInterval`, could discuss WebSockets as alternative*

8. **What is the purpose of `'use client'` directive in your React components?**
   - *Topics: Next.js App Router, Server vs Client components*

9. **How did you implement dark mode in this application?**
   - *Discuss: State management, CSS variables, localStorage persistence*

10. **Explain how the `SensorECG` component renders real-time waveforms using Canvas API.**
    - *Topics: `useRef`, `requestAnimationFrame`, Canvas 2D context, animation loops*

### Backend & API

11. **Walk me through the `/api/alarms` webhook endpoint. How does it handle incoming alarm data?**
    - *Expected: Request validation, Google Sheets logging, in-memory caching, error handling*

12. **Explain the singleton pattern used in `modbus.js` for the Modbus client.**
    - *Why: Connection reuse, resource efficiency, handling reconnection*

13. **How does `getPlcData()` read data from multiple PLC slaves sequentially?**
    - *Topics: Async/await, for...of loops, slave ID switching, error isolation*

14. **What is the purpose of the audit logging in your API endpoints?**
    - *Discuss: Traceability, compliance, debugging, security*

15. **How do you handle cases when the PLC connection fails?**
    - *Answer: Graceful degradation, `offline` flag, automatic reconnection attempts, timeout handling*

---

## 📡 Protocols & Integration

16. **What is Modbus TCP/IP? How does it differ from Modbus RTU?**
    - *Expected: TCP vs Serial, IP-based communication, port 502, no framing differences*

17. **Explain the coil addressing scheme in your Modbus implementation.**
    - *Topics: Coil 0 = Panic, Coil 1 = Door, slave IDs for rooms*

18. **Why did you use Google Sheets as a database instead of MongoDB or PostgreSQL?**
    - *Discuss: Simplicity, no server required, client familiarity, data sharing, limitations*

19. **How did you integrate Google Sheets API? Explain the authentication process.**
    - *Topics: Service Account, OAuth scopes, `googleapis` library, credentials management*
    - *I integrated the Google Sheets API using a Service Account because it allows for server-to-server communication without user intervention. I securely stored the credentials in environment variables and used the googleapis library to initialize a v4 client. To ensure the application could write to the sheet, I shared the specific spreadsheet with the service account's email as an editor. This setup makes the logging process robust, secure, and completely automated.*

20. **What security considerations are there when storing Google credentials in `.env.local`?**
    - *Discuss: Environment variables, secret management, deployment considerations*

---

## 🎨 Frontend & UI/UX

21. **How did you create the interactive warehouse map with room overlays?**
    - *Topics: CSS positioning, percentage-based layouts, dynamic status indicators*

22. **Explain the alarm severity mapping system in your application.**
    - *Answer: CRITICAL, HIGH, MEDIUM levels, color-coded UI, different behaviors*

23. **How do you ensure the dashboard is responsive across different devices?**
    - *Topics: Tailwind CSS, flexbox/grid, media queries, viewport units*

24. **What is glassmorphism and how did you implement it in your UI?**
    - *CSS: `backdrop-filter: blur()`, transparent backgrounds, layered design*

25. **How does the `AlertModal` component display alarm details?**
    - *Discuss: Modal patterns, props drilling, conditional rendering*

---

## 🔧 Error Handling & Resilience

26. **How does your system behave when the PLC is offline?**
    - *Answer: I designed the system to be 'fail-aware'. In the backend, I use try-catch blocks and a singleton pattern to detect and recover from Modbus connection failures. On the frontend, if the PLC goes offline, we don't just show empty data; the UI explicitly flags the room as 'PLC NOT ALIVE' and logs a 'CONNECTION LOST' event. This ensures that the warehouse operator is never misled into thinking the lack of an alarm means the system is safe when it’s actually disconnected.*

27. **What happens if Google Sheets API fails? How do you handle this gracefully?**
    - *Topics: Try-catch blocks, null returns, fallback behavior, warning logs*
    - *'ve prioritized system availability over logging persistence. In my implementation, the Google Sheets API is treated as a 'nice-to-have' but non-critical service. If the API fails—whether due to credentials, quota limits, or network issues—the Next.js server catches the error, logs a warning, and continues to handle real-time alarms in-memory. This ensures that even if our audit log is temporarily unavailable, the warehouse operator still gets active alerts on their dashboard without any interruption.*

28. **Explain the retry mechanism in your Modbus client connection.**
    - *Focus: Connection state check, reconnection logic, client reset on failure*

29. **How would you implement circuit breaker pattern for the PLC communication?**
    - *Advanced: Failure thresholds, half-open states, fallback mechanisms*
    - *I would implement a circuit breaker using a state machine with three states: CLOSED, OPEN, and HALF_OPEN. In the CLOSED state, requests pass through normally. If failures exceed a threshold (e.g., 3 consecutive failures), the breaker trips to OPEN, immediately rejecting requests and preventing further load on the failing PLC. After a timeout period, it enters HALF_OPEN to test recovery. If the test succeeds, it closes; if it fails, it stays open. This pattern prevents cascading failures and allows the system to self-heal without overwhelming the network during PLC downtime.*

---

## 🧪 Testing & Debugging

30. **How did you test the application without a physical PLC?**
    - *Answer: ModbusPal simulator, test scripts, mock data*

31. **Explain the purpose of `scripts/test-lib-modbus.mjs`.**
    - *Topics: Integration testing, connection verification, coil reading validation*

32. **How would you write unit tests for the `WarehouseDashboard` component?**
    - *Discuss: Jest, React Testing Library, mocking API calls, snapshot testing*

33. **What tools would you use for end-to-end testing of this application?**
    - *Options: Cypress, Playwright, Puppeteer*

---

## 📊 Data & State Management

34. **Why did you use `global.monitorState` instead of React Context or Redux?**
    - *Topic: Server-side state vs client-side, Next.js API routes, simplicity*

35. **How do you maintain alarm history in the system?**
    - *Answer: In-memory array (max 50), Google Sheets for persistence*

36. **What problems can arise with the current in-memory caching approach?**
    - *Issues: Server restart loses data, not scalable, single instance only*

37. **How would you implement real-time sync if multiple users are viewing the dashboard?**
    - *Options: WebSockets, Server-Sent Events, polling optimization*

---

## 🚀 Deployment & DevOps

38. **How would you deploy this application to production?**
    - *Topics: Vercel, Docker, environment variables, build process*

39. **What considerations are needed when deploying a Modbus-connected app?**
    - *Network: PLC must be accessible, firewall rules, VPN for remote access*

40. **How do you manage environment variables across development and production?**
    - *Topics: `.env.local`, Vercel secrets, secure credential handling*

---

## 🔒 Security Questions

41. **What security vulnerabilities exist in accepting webhook data from external PLCs?**
    - *Topics: Input validation, authentication, rate limiting, IP whitelisting*

42. **How would you implement authentication for the dashboard?**
    - *Options: NextAuth.js, JWT, session-based auth, role-based access control*

43. **What is the risk of exposing the Modbus endpoint without authentication?**
    - *Discussion: Data exposure, unauthorized control, network segmentation*

---

## 💡 Scenario-Based Questions

44. **A customer reports that alarms are being missed. How would you debug this?**
    - *Approach: Check PLC connection, review logs, verify coil mappings, timing issues*

45. **The dashboard shows "Connecting..." indefinitely. What could be the cause?**
    - *Debug: PLC IP/port mismatch, firewall blocking, ModbusPal not running, network issues*

46. **How would you add support for temperature sensors that return analog values?**
    - *Implementation: Read holding registers instead of coils, scaling formulas, threshold alerts*

47. **A new warehouse has 20 rooms. How would you extend the system?**
    - *Steps: Update `warehouse-map.js`, add slave IDs to `modbus.js`, create room configs*

---

## 🎯 Behavioral & Project Questions

48. **What was the most challenging part of building this project?**
    - *Personal experience: Modbus integration, real-time updates, debugging PLC communication*

49. **What would you do differently if you were to rebuild this project?**
    - *Improvements: Use WebSockets, proper database, authentication, better error handling*

50. **How did you learn about Modbus TCP/IP and PLC integration?**
    - *Show: Self-learning ability, documentation reading, simulator usage*

---

## 📚 Quick Reference: Key Technologies

| Technology | Purpose in Project |
|------------|-------------------|
| **Next.js 16** | Full-stack framework with API routes |
| **React 19** | UI components and state management |
| **Tailwind CSS 4** | Styling and responsive design |
| **Modbus-Serial** | PLC communication library |
| **Google Sheets API** | Cloud-based data logging |
| **Lucide React** | Icon library |
| **Canvas API** | Real-time ECG visualization |

---

## 💡 Tips for the Interview

1. **Know the flow**: Sensor → PLC → Modbus → API → React Dashboard
2. **Understand trade-offs**: Why Google Sheets? Why polling? Why in-memory cache?
3. **Be ready to extend**: Adding temperature, more rooms, authentication
4. **Discuss alternatives**: WebSockets vs polling, Redis vs in-memory, SQL vs Sheets
5. **Show debugging skills**: How you'd trace a missing alarm or connection issue

---

## Extra Questions

1. **What is in memory caching?**
    - *Answer: In-memory caching is a technique used to store frequently accessed data in the main memory (RAM) of a computer system. This allows for faster data retrieval compared to traditional storage methods such as hard drives or databases. In-memory caching is commonly used in web applications to improve performance and reduce latency.*

2. **Summary Checklist for Interviews:**
    - *Web? HTTP/HTTPS*
    - *Speed? UDP*
    - *Reliability? TCP*
    - *Sensors? MQTT / Modbus* 
    - *Files? FTP / SFTP*
    - *Email? SMTP / IMAP*
    - *Networking? DNS / DHCP (assigns IP addresses)*


*Good luck with your interview! 🚀*
