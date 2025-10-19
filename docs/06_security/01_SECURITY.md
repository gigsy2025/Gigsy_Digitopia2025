# Security

## At a Glance

This document provides an overview of the security practices for the Gigsy MVP. It covers authentication, authorization, and data protection.

## Authentication

Authentication is handled by [Clerk](https://clerk.dev/). Clerk is a complete user management solution that provides a secure and scalable way to manage user accounts.

### Features

- **Secure sign-in and sign-up**: Clerk provides a secure and easy-to-use sign-in and sign-up experience for users.
- **Multi-factor authentication**: Clerk supports multi-factor authentication, which adds an extra layer of security to user accounts.
- **Social sign-in**: Clerk supports social sign-in with popular providers like Google, Facebook, and Twitter.

## Authorization

Authorization is handled by a role-based access control (RBAC) system. Each user is assigned a role, and each role has a set of permissions.

### Roles

- **Guest**: Unauthenticated users.
- **Student**: Authenticated users who can apply for gigs.
- **Employer**: Authenticated users who can post gigs.
- **Admin**: Authenticated users with full access to the system.

### Permissions

Permissions are used to control access to specific features and resources. For example, the `post_gigs` permission is required to post a new gig.

## Data Protection

The Gigsy MVP uses a variety of measures to protect user data, including:

- **Encryption**: All data is encrypted at rest and in transit.
- **Access control**: Access to user data is restricted to authorized personnel only.
- **Auditing**: All access to user data is logged and audited.
