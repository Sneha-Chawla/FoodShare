🍲 FoodShare — Real-Time Food Redistribution Platform

URL:https://foodshare-2-44i3.onrender.com/


**FoodShare** is a full-stack, real-time web application built to bridge the gap between food surplus and scarcity. It connects food donors (restaurants, event organizers, households) with NGOs and volunteers in real-time, streamlining logistics to minimize waste and combat hunger.
---
## 🚀 Key Features
- **⚡ Real-Time Coordination & Tracking:** Powered by **Socket.io** WebSockets to broadcast live donation statuses (`pending` ➔ `accepted` ➔ `picked` ➔ `delivered`) with instantaneous updates across all connected clients.
- **🗺️ Interactive Geospatial Mapping:** Integrated with **Leaflet** & **React-Leaflet** to visually map food drop-off and pickup locations, enabling volunteers and NGOs to quickly find surplus food near them.
- **🔐 Secure Role-Based Access:** Dedicated dashboards and workflows for **Donors**, **NGOs**, **Volunteers**, and **Admins** secured by **JWT (JSON Web Tokens)** and **bcrypt** password hashing.
- **📜 QR Code Verification & Certificates:** Generates verifiable QR codes upon delivery completion and issues customized recognition certificates for donors and volunteers.
- **📊 Admin & Analytics Dashboard:** High-level metrics tracking total donations, active requests, user distribution, and real-time activity logs.
- **📱 Responsive & Accessible UI:** Modern interface built with React, styled with clean component layouts, and enhanced with **Lucide Icons** and **React Hot Toast** notifications.
---
## 🛠️ Tech Stack
### Frontend
- **Framework & Build:** [React 19](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Maps:** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Real-Time Client:** [Socket.io Client](https://socket.io/docs/v4/client-api/)
- **UI & Utilities:** [Lucide React](https://lucide.dev/), [React Hot Toast](https://react-hot-toast.com/), [qrcode.react](https://github.com/zpao/qrcode.react), [date-fns](https://date-fns.org/)
### Backend
- **Runtime & Server:** [Node.js](https://nodejs.org/) & [Express 5](https://expressjs.com/)
- **Database:** [SQLite3](https://www.sqlite.org/)
- **Authentication:** [jsonwebtoken (JWT)](https://jwt.io/) & [bcrypt](https://www.npmjs.com/package/bcrypt)
- **Real-Time Engine:** [Socket.io](https://socket.io/)
