<div align="center">

# 🚀 Gigsy - The Future of Gig Economy & Learning

### *Empowering Freelancers, Students & Employers Through Technology*

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Convex](https://img.shields.io/badge/Convex-1.26-orange?style=for-the-badge&logo=convex&logoColor=white)](https://convex.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## Lighthouse Scores

Desktop (Nov 4, 2025) on homepage

![Performance](https://img.shields.io/badge/Performance-97-brightgreen?logo=lighthouse&logoColor=white)
![Accessibility](https://img.shields.io/badge/Accessibility-100-brightgreen?logo=lighthouse&logoColor=white)
![Best%20Practices](https://img.shields.io/badge/Best%20Practices-100-brightgreen?logo=lighthouse&logoColor=white)
![SEO](https://img.shields.io/badge/SEO-100-brightgreen?logo=lighthouse&logoColor=white)

- Full report: [PageSpeed Insights result](https://pagespeed.web.dev/analysis/https-gigsy-digitopia2025-vercel-app/8i7wak0hhn?form_factor=desktop)
- Tested page: https://gigsy-digitopia2025.vercel.app/
- Device: Desktop preset • Throttling: Default Lighthouse
- Lighthouse run date: 2025-11-04

Reproduce locally:
```bash
npx lighthouse https://gigsy-digitopia2025.vercel.app/ --preset=desktop --output=html --output-path=./lighthouse-report.html
```

Note: Scores may vary slightly over time due to content, caching, and network conditions.

---

## 📖 Table of Contents

- [🌟 What is Gigsy?](#-what-is-gigsy)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📚 Core Services](#-core-services)
- [🎯 Use Cases](#-use-cases)
- [🔒 Security & Compliance](#-security--compliance)
- [🌐 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 Documentation](#-documentation)
- [👥 Team](#-team)

---

## 🌟 What is Gigsy?

**Gigsy** is a comprehensive, production-grade platform that revolutionizes the gig economy by seamlessly integrating:

🎯 **Marketplace** - Connect talented freelancers with exciting opportunities  
📚 **Learning Management** - Upskill with industry-leading courses  
🎮 **Gamification** - Earn points, badges, and climb leaderboards  
💬 **Real-time Chat** - Communicate seamlessly with employers and mentors  
💰 **Financial System** - Secure multi-currency wallets with escrow protection

### 🎨 Built for the Modern Web

Gigsy leverages cutting-edge technologies to deliver a **blazing-fast**, **scalable**, and **secure** platform that serves students, freelancers, and employers alike.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🎯 For Freelancers
- 🔍 **Smart Job Matching** - AI-powered recommendations
- 💼 **Portfolio Building** - Showcase your best work
- 📊 **Progress Tracking** - Monitor your growth
- 💰 **Secure Payments** - Multi-currency wallet support
- 🏆 **Reputation System** - Build your professional brand

</td>
<td width="50%">

### 🏢 For Employers
- 📝 **Easy Job Posting** - Create gigs in minutes
- 👥 **Talent Discovery** - Find the perfect match
- 💬 **Direct Communication** - Built-in chat system
- 🔐 **Escrow Protection** - Secure payment handling
- 📈 **Analytics Dashboard** - Track hiring metrics

</td>
</tr>
<tr>
<td width="50%">

### 📚 Learning Platform
- 🎓 **Comprehensive Courses** - Industry-standard content
- 🎥 **Video Lessons** - High-quality learning materials
- 📝 **Interactive Quizzes** - Test your knowledge
- 📊 **Progress Analytics** - Track learning journey
- 🎖️ **Certificates** - Earn verified credentials

</td>
<td width="50%">

### 🎮 Gamification
- ⭐ **Points System** - Earn rewards for achievements
- 🏅 **Badges & Titles** - Showcase accomplishments
- 🏆 **Leaderboards** - Compete with peers
- 🎯 **Challenges** - Complete tasks for bonuses
- 📈 **Level Up** - Progress through tiers

</td>
</tr>
</table>

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│                    (Next.js 15 + React 19)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   SSR    │  │   SSG    │  │   ISR    │  │  Client  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API & Authentication                          │
│              (Convex Backend + Clerk Auth)                       │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Core Services                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │  Gigs  │ │  LMS   │ │  Chat  │ │Finance │ │  Game  │       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data & Storage                              │
│    Convex DB | Redis | Vector DB | S3 Storage                   │
└─────────────────────────────────────────────────────────────────┘
```

### 🔑 Key Architectural Principles

✅ **Microservices-Ready** - Modular design for easy scaling  
✅ **Event-Driven** - Reactive architecture with real-time updates  
✅ **Immutable Data** - Append-only ledgers for financial integrity  
✅ **Type-Safe** - End-to-end TypeScript for reliability  
✅ **Cloud-Native** - Containerized with Docker for any deployment

---

## 🛠️ Tech Stack

### Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| ⚡ **Next.js** | 15.2.3 | React framework with SSR/SSG |
| ⚛️ **React** | 19.0.0 | UI library |
| 🎨 **Tailwind CSS** | 4.0 | Utility-first styling |
| 📦 **TypeScript** | 5.8.2 | Type safety |
| 🎭 **Shadcn UI** | Latest | Beautiful component library |
| 🧬 **Jotai** | 2.14.0 | Atomic state management |
| 📝 **React Hook Form** | 7.62.0 | Form handling |
| ✅ **Zod** | 3.25.76 | Schema validation |

### Backend & Data

| Technology | Purpose |
|-----------|---------|
| 🔄 **Convex** | Real-time backend & database |
| 🔐 **Clerk** | Authentication & user management |
| 💾 **Redis** | Caching & session storage |
| 🔍 **Vector DB** | AI-powered search & recommendations |
| 📁 **S3/Storage** | File & media storage |

### DevOps & Tools

| Tool | Purpose |
|------|---------|
| 🐳 **Docker** | Containerization |
| 🚀 **GitHub Actions** | CI/CD pipelines |
| 🔍 **ESLint** | Code linting |
| 🎨 **Prettier** | Code formatting |
| 🧪 **Jest + Vitest** | Testing frameworks |
| 📊 **Sentry** | Error monitoring |
| 📝 **Pino** | Structured logging |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- pnpm 9+ package manager
- Git for version control
- Convex account (free tier available)
- Clerk account (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/gigsy2025/Gigsy_Digitopia2025.git
cd Gigsy_Digitopia2025

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start Convex development server
npx convex dev

# In a new terminal, start Next.js
pnpm dev
```

### 🌐 Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🔑 Environment Variables

Create a `.env.local` file with:

```env
# Convex
CONVEX_DEPLOYMENT=your-deployment-url
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# Sentry (Optional)
SENTRY_DSN=your-sentry-dsn

# Other Services
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📚 Core Services

### 🎯 1. Gig Marketplace Service

**Purpose**: Connect freelancers with job opportunities

**Features**:
- ✍️ Create and manage gig postings
- 🔍 Advanced search with filters
- 💼 Application management system
- 📊 Status tracking (draft → open → in_progress → completed)
- 💰 Budget management with multi-currency support

**Tech Highlights**:
- State machine-based lifecycle management
- Optimized indexes for fast queries
- Vector embeddings for smart matching

---

### 📚 2. Learning Management System (LMS)

**Purpose**: Provide structured educational content

**Features**:
- 📖 Course, module, and lesson hierarchy
- 🎥 Video content with progress tracking
- 📝 Timed quizzes every 25 minutes
- 📊 Granular progress analytics
- 🎓 Completion certificates

**Tech Highlights**:
- Convex file storage for videos
- Real-time progress synchronization
- Behavioral analytics (seek events, pause counts)
- Watch time tracking with anti-gaming measures

---

### 💬 3. Chat Service

**Purpose**: Enable real-time communication

**Features**:
- 💬 One-on-one conversations
- 📎 File attachments
- ✍️ Typing indicators
- 🔔 Read receipts
- 📱 Real-time updates

**Tech Highlights**:
- Lightweight conversation metadata
- Immutable message stream
- Ephemeral status management
- Optimized join tables for fast queries

---

### 💰 4. Financial & Ledger Service

**Purpose**: Manage payments and transactions

**Features**:
- 💵 Multi-currency wallet support (EGP, USD, EUR)
- 🔒 Escrow system for secure payments
- 📊 Immutable transaction ledger
- 💳 Payment gateway integration
- 📈 Financial analytics

**Tech Highlights**:
- Append-only ledger (no mutable balances)
- Idempotent transaction processing
- Atomic operations for integrity
- Cached balance projections for performance

---

### 🎮 5. Gamification Service

**Purpose**: Drive engagement through rewards

**Features**:
- ⭐ Points system for achievements
- 🏅 Badges for milestones
- 🎖️ Customizable titles
- 🏆 Real-time leaderboards
- 🎯 Event-driven rewards

**Tech Highlights**:
- Configurable gamification rules
- Auditable points log
- Event-driven architecture
- Automated reward distribution

---

### 👤 6. User & Profile Service

**Purpose**: Manage user identity and profiles

**Features**:
- 🔐 Decoupled authentication (Clerk integration)
- 💼 Rich portfolio support
- 🎓 Education & work experience tracking
- 🌍 Location and timezone data
- 🔍 Vector embeddings for recommendations

**Tech Highlights**:
- Ledger-first financial balance caching
- Role-based authorization (freelancer, client, admin)
- Profile completeness scoring
- Multi-currency balance support

---

## 🎯 Use Cases

### For Students/Freelancers 👨‍💻

```
1. Sign up & complete profile
2. Browse & enroll in courses
3. Complete lessons & earn certificates
4. Search for relevant gigs
5. Apply with custom cover letter
6. Chat with potential employers
7. Get hired & start working
8. Receive secure payment to wallet
9. Earn badges & climb leaderboard
```

### For Employers 🏢

```
1. Create employer account
2. Fund wallet with secure payment
3. Post gig with detailed requirements
4. Review incoming applications
5. Chat with top candidates
6. Hire best match with escrow
7. Monitor work progress
8. Approve & release payment
9. Leave rating & review
```

### For Course Creators 🎓

```
1. Create course structure
2. Upload video content
3. Add quizzes & assessments
4. Publish to platform
5. Track student engagement
6. Earn revenue from enrollments
```

---

## 🔒 Security & Compliance

### Security Features

✅ **Authentication**: Clerk-powered secure auth with MFA support  
✅ **Authorization**: Role-based access control (RBAC)  
✅ **Data Encryption**: End-to-end encryption for sensitive data  
✅ **Input Validation**: Zod schema validation on all inputs  
✅ **CSRF Protection**: Built-in Next.js security  
✅ **Rate Limiting**: Prevent abuse and DDoS attacks  
✅ **Audit Logging**: Comprehensive activity tracking  
✅ **Secure File Upload**: Virus scanning and type validation

### Financial Security

- 🔐 PCI-DSS compliant payment processing
- 💰 Escrow system for transaction protection
- 📊 Immutable transaction ledger
- 🔍 Fraud detection and monitoring
- 💳 Multiple payment gateway support

---

## 🌐 Deployment

### Docker Deployment

```bash
# Build the Docker image
docker build -t gigsy:latest .

# Run with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel deploy --prod
```

### Environment-Specific Configs

- **Development**: Hot reload, debug logging
- **Staging**: Production-like environment for testing
- **Production**: Optimized builds, error monitoring, CDN

---

## 🤝 Contributing

We welcome contributions from the community! 🎉

### Getting Started

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. ✍️ Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔀 Open a Pull Request

### Development Guidelines

- 📝 Write clear, descriptive commit messages
- ✅ Ensure all tests pass before submitting
- 📚 Update documentation as needed
- 🎨 Follow the existing code style
- 🐛 Include tests for bug fixes
- ✨ Add tests for new features

### Code Quality Standards

```bash
# Run linter
pnpm lint

# Run type check
pnpm typecheck

# Run tests
pnpm test

# Format code
pnpm format:write
```

---

## 📄 Documentation

📖 **Comprehensive documentation available in the `/docs` directory:**

### Quick Links

- 📘 [System Overview](./docs/01_introduction/01_SYSTEM_OVERVIEW.md)
- 🏗️ [Architecture Documentation](./docs/02_architecture/)
- 🔌 [API Reference](./docs/03_api_reference/)
- 📚 [Development Guides](./docs/04_guides/)
- 🤝 [Contributing Guide](./docs/05_contributing/01_CONTRIBUTING.md)
- 🔒 [Security Overview](./docs/06_security/)

### Architecture Documents

- [Users & Profiles](/.github/instructions/GSY-ARCH-USERS-2025.md)
- [Gig Marketplace](/.github/instructions/GSY-ARCH-GIGS-2025-01.md)
- [Learning Management System](/.github/instructions/GSY-ARCH-LMS-2025-01.md)
- [Chat Service](/.github/instructions/GSY-ARCH-CHAT-2025-01.md)
- [Gamification](/.github/instructions/GSY-ARCH-GAME-2025-01.md)
- [Financial Ledger](/.github/instructions/GSY-ARCH-LEDGER-2025-01.md)
- [Applications](/.github/instructions/GSY-ARCH-APPLICATIONS-2025-01.md)
- [Long-term Architecture](/.github/instructions/Gigsy%20Long%20Term%20Technical%20Architecture.md)

---

## 👥 Team

### Core Contributors

**Gigsy** is built with ❤️ by a dedicated team of engineers and designers passionate about empowering the gig economy.

### Architecture & Development

- 🏗️ **Principal Architect**: Mostafa Yaser - System architecture & technical leadership
- 💻 **Development Team**: Full-stack engineers focused on quality and performance
- 🎨 **Design Team**: UX/UI specialists creating delightful experiences

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/gigsy2025/Gigsy_Digitopia2025?style=social)
![GitHub forks](https://img.shields.io/github/forks/gigsy2025/Gigsy_Digitopia2025?style=social)
![GitHub issues](https://img.shields.io/github/issues/gigsy2025/Gigsy_Digitopia2025)
![GitHub pull requests](https://img.shields.io/github/issues-pr/gigsy2025/Gigsy_Digitopia2025)

---

## 🌟 Features Roadmap

### ✅ Completed

- [x] User authentication & authorization
- [x] Gig marketplace with search
- [x] LMS with video lessons
- [x] Real-time chat system
- [x] Multi-currency wallet system
- [x] Gamification with points & badges
- [x] Application management
- [x] Profile building

### 🚧 In Progress

- [ ] AI-powered job matching
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Video calls for interviews
- [ ] Advanced course authoring tools

### 🔮 Future Plans

- [ ] Blockchain-based certificates
- [ ] DAO governance system
- [ ] Metaverse integration
- [ ] Global payment gateways
- [ ] Advanced recommendation engine

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Special thanks to:

- 🎯 **Next.js Team** - For the incredible framework
- 🔄 **Convex** - For the powerful real-time backend
- 🔐 **Clerk** - For seamless authentication
- 🎨 **Shadcn** - For beautiful UI components
- 💻 **Open Source Community** - For inspiration and tools

---

## 📞 Contact & Support

- 🌐 **Website**: [Coming Soon]
- 📧 **Email**: support@gigsy.io
- 💬 **Discord**: [Join our community]
- 🐦 **Twitter**: [@GigsyPlatform]
- 📱 **LinkedIn**: [Gigsy Platform]

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

**Built with 💙 by the Gigsy Team**

*Empowering the future of work and learning*

[⬆ Back to Top](#-gigsy---the-future-of-gig-economy--learning)

</div>
