# License Key Validation API

A production-ready, open-source License Key Validation API built with Node.js, Express, PostgreSQL, and Prisma. This project is completely free and open for everyone to use, modify, and learn from.

## 💝 About This Project

This API was created with the intention of helping developers and small businesses implement secure license key validation without the burden of expensive third-party services. Whether you're building a SaaS product, desktop application, or any software that needs license management, this solution is here for you - completely free, no strings attached.

I believe that good tools should be accessible to everyone, especially indie developers and startups who are just getting started. Feel free to use this in your commercial projects, modify it to fit your needs, or learn from the code. If this helps your project succeed, that's all the reward needed.

## ✨ Features

- **License Key Management** - Secure license generation with bcrypt hashing and customizable expiration
- **Device Binding** - Limit activations per license with configurable device limits
- **Hardware Fingerprinting** - Bind licenses to specific devices using hardware IDs
- **JWT-Signed Responses** - Cryptographically signed validation responses for client-side verification
- **Multi-Layer Security**
  - API key authentication
  - Request signature verification
  - IP-based rate limiting
  - Per-key rate limiting
- **Usage Analytics** - Track activation attempts, validation requests, and device management
- **Audit Logging** - Complete audit trail of all license operations
- **Flexible Metadata** - Store custom data with each license (user info, features, etc.)
- **Docker Ready** - Full Docker and Docker Compose support
- **One-Click Deploy** - Railway deployment configuration included
- **Admin CLI** - Command-line tools for license and API key management

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+ (or use Docker)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd license-key-validation-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials and settings
```

4. **Setup database**
```bash
npm run prisma:migrate
npm run prisma:seed
```

5. **Generate security credentials**
```bash
# Generate JWT secrets and encryption keys
npm run admin generate-secrets

# Create your first API key
npm run admin generate-api-key "My Application" user-123
```

6. **Start the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Your API will be running at `http://localhost:3000`

### Docker Quick Start

```bash
# Start everything with Docker Compose
docker-compose up -d

# Generate credentials
docker-compose exec api npm run admin generate-secrets
docker-compose exec api npm run admin generate-api-key "My App" user-123
```

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check and system status |
| `POST` | `/api/activate` | Activate a license key for a specific device |
| `POST` | `/api/validate` | Validate license and device binding |
| `POST` | `/api/deactivate` | Remove a device from a license |

### Example Request

```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -H "X-Signature: request-signature" \
  -d '{
    "licenseKey": "XXXX-XXXX-XXXX-XXXX",
    "deviceId": "unique-device-identifier"
  }'
```

### Example Response

```json
{
  "valid": true,
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "deviceLimit": 3,
  "devicesUsed": 1,
  "metadata": {
    "plan": "pro",
    "features": ["feature1", "feature2"]
  },
  "signature": "jwt-signature-for-verification"
}
```

## 📚 Documentation

- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Detailed setup and configuration
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Security Guide](docs/SECURITY.md)** - Security implementation and best practices
- **[Railway Deployment](docs/RAILWAY_DEPLOYMENT.md)** - One-click deployment to Railway
- **[Quick Start Guide](docs/QUICKSTART.md)** - Fast deployment options

## 🛠️ Use Cases

- **SaaS Applications** - Manage subscriptions and feature access
- **Desktop Software** - License commercial desktop applications
- **Mobile Apps** - Control app features and premium access
- **Plugin Systems** - License plugins and extensions
- **API Access Control** - Manage API usage and quotas
- **Educational Software** - Distribute licenses to students/institutions

## 🔒 Security Features

This API implements multiple layers of security to protect your license system:

- **Bcrypt Hashing** - License keys are hashed before storage
- **API Key Authentication** - Prevent unauthorized access
- **Request Signature Verification** - Ensure request integrity
- **Rate Limiting** - Prevent brute force and abuse
- **IP Whitelisting** - Optional IP-based access control
- **JWT Signing** - Cryptographically signed responses
- **Audit Logging** - Track all operations for security review

## 🎯 Admin CLI Tools

Manage your license system from the command line:

```bash
# Generate security secrets
npm run admin generate-secrets

# Create API keys
npm run admin generate-api-key "App Name" "user-id"

# Create licenses
npm run admin create-license "user-id" 5 365

# List all licenses
npm run admin list-licenses

# Revoke a license
npm run admin revoke-license "LICENSE-KEY"
```

## 🏗️ Tech Stack

- **Runtime** - Node.js 16+
- **Framework** - Express.js
- **Database** - PostgreSQL 12+
- **ORM** - Prisma
- **Authentication** - JWT (jsonwebtoken)
- **Encryption** - bcrypt, crypto
- **Rate Limiting** - express-rate-limit
- **Validation** - express-validator
- **Logging** - Winston (optional)
- **Deployment** - Docker, Railway

## 🤝 Contributing

Contributions are welcome! Whether it's bug fixes, feature additions, documentation improvements, or suggestions - all contributions help make this project better for everyone.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💬 Support

- **Issues** - Report bugs or request features via GitHub Issues
- **Discussions** - Ask questions and share ideas in GitHub Discussions
- **Documentation** - Check the `/docs` folder for detailed guides

## 🙏 Acknowledgments

This project was built to help the developer community. Special thanks to everyone who uses, contributes to, or provides feedback on this project. Your support and input make this better for everyone.

## ⭐ Show Your Support

If this project helps you, please consider giving it a star on GitHub. It helps others discover this free tool and motivates continued development and maintenance.

## 📄 License

MIT License - This means you can use this project for anything, including commercial projects, without any restrictions. See the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the developer community**

*Free forever. No premium tiers. No hidden costs. Just good software for everyone.*
