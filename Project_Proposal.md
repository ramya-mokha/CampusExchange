# Project Proposal: Campus Exchange
> **A Cloud-Based Marketplace for University Students**
> *"Buy. Sell. Reuse. Save."*

---

## 1. Executive Summary

**Campus Exchange** is a centralized, secure, cloud-based mobile marketplace designed exclusively for university students. Within any academic campus, students frequently cycle through items they no longer need—such as textbooks, calculators, electronics, hostel essentials, furniture, and bicycles. Concurrently, incoming or current students look to acquire these exact items at affordable prices. 

Currently, these transactions are highly fragmented, occurring sporadically through WhatsApp groups, Discord servers, or personal contacts, leading to poor discoverability, communication fatigue, and safety concerns. **Campus Exchange** solves this by providing a unified Android mobile application built with **React Native** and powered by a robust **Node.js/Express** backend hosted in the cloud, utilizing **MongoDB Atlas** for data persistence and **Cloudinary** for image assets.

---

## 2. Problem Statement

At the end of semesters or academic years, students face a common challenge: what to do with valuable items they can no longer store or transport. At the same time, new semesters bring a surge of students needing textbooks, calculators, refrigerators, mattresses, and bicycles. 

The existing solutions have significant limitations:
1. **Inefficient Discoverability:** Listings on WhatsApp groups get lost quickly in chat history.
2. **Exclusivity Issues:** Open market platforms (like OLX, Facebook Marketplace) expose students to external strangers, raising security and campus-accessibility concerns.
3. **No Safety Verification:** Transactions with strangers outside the campus lack safety and accountability.
4. **Poor Coordination:** No structured scheduling or designated safe handover locations within the university.

---

## 3. Project Objectives

- **Centralized Marketplace:** Provide a dedicated platform restricted to university students to discover, buy, and sell second-hand items.
- **Leverage Cloud Architecture:** Build a scalable, highly available application using cloud storage, cloud database clustering, and serverless/cloud hosting.
- **Safety & Campus-Centricity:** Enhance safety by integrating designated **Campus Pickup Locations** and university-restricted email validation.
- **Real-Time Communication:** Allow direct buyer-seller negotiations via an in-app instant messaging system.
- **Dashboard Analytics:** Provide students with listings/sold statistics and admins with platform oversight, moderation tools, and global usage analytics.

---

## 4. Key Modules & Features

### 4.1. User Authentication
* **Student Registration:** Students sign up using their university credentials (with optional VIT/university email verification).
* **Secure Login:** Encrypted login utilizing JSON Web Tokens (JWT) for secure session persistence on the mobile device.
* **Role-Based Access Control:** Separate interfaces and privileges for general students and platform administrators.

### 4.2. Product Management
* **List an Item:** Add product name, detailed description, category, price, condition (New, Like New, Good, Fair), and upload multiple images.
* **Campus Pickup Location Selection:** Sellers choose a designated campus exchange point (e.g., Library, AB1, AB2, Hostel Gate, Food Court, Academic Block) to ensure safe, convenient on-campus handovers.
* **Listings Control:** Sellers can edit listing details, mark products as **Sold**, or delete their listings.

### 4.3. Product Discovery (Search & Filters)
* **Search:** Search bar for finding products by name or description keywords.
* **Category Filters:** Quick category browsing (📚 Books, 💻 Electronics, 🪑 Furniture, 🚲 Cycles, 👕 Clothing, 🎒 Hostel Essentials, 🔌 Accessories, etc.).
* **Advanced Filters:** Filter products by Price Range, Condition, and Campus Pickup Location.

### 4.4. In-App Buyer-Seller Chat
* Direct messaging inside the app to negotiate prices and schedule pickups.
* Powered by real-time WebSockets, avoiding SMS costs and preserving user privacy.

### 4.5. Wishlist
* Save interesting products to a personal wishlist for quick access and price monitoring.

### 4.6. Dashboards & Analytics
* **Student Dashboard:** View active listings, items sold, wishlist, and recent browsing/purchase activities.
* **Admin Dashboard:** Moderation panel to manage reported items, view system stats (Total Users, Total Products, Sold Count, and Popular Categories), and ban/unban users.

---

## 5. System Architecture

The application adopts a classic three-tier architecture fully integrated with cloud-native services to support modern scalability and cross-device availability.

```
       [ Student / Administrator App ]
                      │
                      ▼
        ┌───────────────────────────┐
        │   React Native Frontend   │  (Expo / Mobile UI)
        └─────────────┬─────────────┘
                      │
                      │ HTTPS / WSS
                      ▼
        ┌───────────────────────────┐
        │ Node.js / Express Backend │  (Cloud API Server)
        └───────┬─────────────┬─────┘
                │             │
        Mongoose│             │ API Upload
                ▼             ▼
        ┌──────────────┐    ┌────────────┐
        │MongoDB Atlas │    │ Cloudinary │ (Cloud Assets)
        │ (Cloud DB)   │    │  (Storage) │
        └──────────────┘    └────────────┘
```

### Cloud Integration Breakdown

| Cloud Concept | Service Provider | Implementation Detail |
| :--- | :--- | :--- |
| **Cloud Storage** | **Cloudinary** | Product images are sent from the mobile device directly to Cloudinary, returning a secure CDN URL that is saved in the database. |
| **Cloud Database** | **MongoDB Atlas** | Fully managed MongoDB cluster with automatic scaling, replication, and backup, storing documents for users, listings, chats, and locations. |
| **Cloud Hosting** | **Render / Vercel** | Backend Node.js engine is hosted on Render (allowing continuous integrations and web sockets). Admin UI or documentation hosted on Vercel. |
| **Anywhere Access** | **Internet-Enabled** | Any student with the app and internet connection can check prices and chat instantly, synchronized across devices. |
| **Scalability & Security**| **JWT + Atlas Scaling** | Secure token exchange coupled with MongoDB's multi-region clustering to scale as student volume rises. |

---

## 6. Cloud Workflows

### 6.1. Product Upload Workflow
1. The student selects images from their phone gallery or takes a picture using the camera.
2. The React Native frontend uploads the image binary to the Express server.
3. The Express server forwards the asset to the **Cloudinary** API.
4. **Cloudinary** processes, optimizes, and hosts the image, returning a secure HTTPS URL.
5. The Express server stores the product metadata (name, price, pickup location) alongside the Cloudinary image URL in **MongoDB Atlas**.
6. The updated list is broadcasted in real time to all connected clients.

```
+------------+          +------------+          +------------+          +---------------+
| React      |          | Express    |          | Cloudinary |          | MongoDB Atlas |
| Native     |          | Server     |          | (Cloud)    |          | (Database)    |
+-----+------+          +-----+------+          +-----+------+          +-------+-------+
      |                       |                       |                         |
      | 1. Submit Product     |                       |                         |
      |---------------------->|                       |                         |
      |                       | 2. Upload Image       |                         |
      |                       |---------------------->|                         |
      |                       |                       |                         |
      |                       | 3. Image URL Return   |                         |
      |                       |<----------------------|                         |
      |                       |                                                 |
      |                       | 4. Save Product (Details + Image URL)           |
      |                       |------------------------------------------------>|
      |                       |                                                 |
      |                       | 5. DB Success Acknowledgment                    |
      |                       |<------------------------------------------------|
      |                       |                                                 |
      | 6. Render Feed        |                                                 |
      |<----------------------|                                                 |
```

### 6.2. Campus Pickup Locations Workflow
The seller defines a safe handover spot inside the university bounds, enhancing physical safety:

```
[Create Listing Screen] ──> Select "Library" ──> Saved to Database
                                                     │
                                                     ▼
                                         [Product Details Screen]
                                    Shows: "Pickup Location: Library"
                                                     │
                                                     ▼
                                           [Chat Confirmation]
                                      "Meet outside Library main gate"
```

---

## 7. Database Design (MongoDB Schemas)

### User Schema (`users`)
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String (Unique, verified format)",
  "passwordHash": "String",
  "role": "String (student / admin)",
  "wishlist": ["ObjectId(Product)"],
  "createdAt": "Date"
}
```

### Product Schema (`products`)
```json
{
  "_id": "ObjectId",
  "name": "String",
  "description": "String",
  "category": "String",
  "price": "Number",
  "condition": "String (New / Like New / Good / Fair)",
  "images": ["String (Cloudinary URLs)"],
  "pickupLocation": "String (Library / AB1 / AB2 / Hostel Gate / Food Court / Academic Block)",
  "seller": "ObjectId(User)",
  "status": "String (active / sold)",
  "createdAt": "Date"
}
```

### Message Schema (`messages`)
```json
{
  "_id": "ObjectId",
  "chatId": "String (senderId_receiverId)",
  "sender": "ObjectId(User)",
  "recipient": "ObjectId(User)",
  "text": "String",
  "timestamp": "Date"
}
```

---

## 8. Technology Stack

* **Mobile App Frontend:** React Native, Expo, React Navigation, Socket.io-client, React Native Paper.
* **Backend API Server:** Node.js, Express, Socket.io, Mongoose (MongoDB ODM).
* **Cloud Database:** MongoDB Atlas.
* **Cloud Media Storage:** Cloudinary.
* **Authentication:** JSON Web Tokens (JWT), BCrypt.js.
* **Deployment Platforms:** Render (Backend), Expo EAS / Local APK compilation (Android Frontend).

---

## 9. Future Enhancements

1. **AI-Based Price Suggestion:** Analyze historical sales of similar textbooks or calculators to suggest an optimal listing price to the seller.
2. **Product Rating & Reviews:** Introduce seller feedback loops to build trust within the student community.
3. **QR Code Verification:** Generate a QR code for transactions. Once the buyer and seller meet, scanning the QR code confirms payment/handover and automatically marks the item as sold.
4. **Push Notifications:** Send alerts for chat messages, price drops on wishlisted items, and new products matching saved searches.
5. **Secure Payment Escrow:** Integrated micro-payment gateway where money is held securely until both parties verify the physical delivery of the item.

---

## 10. Conclusion

**Campus Exchange** changes how university students recycle items inside campuses. By moving away from unstructured WhatsApp chats and integrating cloud databases, asset storage, real-time messaging, and specialized features like **Campus Pickup Locations**, the platform delivers a secure, structured, and responsive application. This cloud-first architecture guarantees reliability, scalability, and ease of access for the modern student body.
