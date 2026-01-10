# WorldSamma Shop - Martial Arts E-Commerce Platform

A full-featured e-commerce platform for WorldSamma martial arts academy, built with modern web technologies.

## Features

- **Public Store**

  - Homepage with featured products
  - Product listings with filters (categories, belt levels, tags)
  - Product detail pages
  - Shopping cart
  - Checkout process
  - PayPal and M-Pesa payment integration

- **Admin Dashboard**

  - Product management (CRUD operations)
  - Order management
  - Analytics dashboard
  - Customer management

- **Technical Features**
  - Server-side rendering with Next.js 15
  - TypeScript for type safety
  - Responsive design with TailwindCSS
  - UI components from ShadCN UI
  - Dark mode support
  - Supabase for database, authentication, and storage
  - Payment processing with PayPal and M-Pesa

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS, ShadCN UI
- **Backend**: Next.js API routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: PayPal Checkout, M-Pesa Daraja API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account
- PayPal Developer account
- M-Pesa Daraja API account (optional)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/worldsamma-shop.git
   cd worldsamma-shop
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the following variables:

   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Database (if using external DB)
   DATABASE_URL=your_database_url

   # PayPal
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_SECRET=your_paypal_secret
   PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

   # M-Pesa (Optional)
   MPESA_CONSUMER_KEY=your_mpesa_consumer_key
   MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
   MPESA_SHORTCODE=your_mpesa_shortcode
   MPESA_PASSKEY=your_mpesa_passkey
   MPESA_CALLBACK_SECRET=your_mpesa_callback_secret

   # Email (for notifications)
   RESEND_API_KEY=your_resend_api_key

   # Vercel
   VERCEL_ENV=development
   ```

4. Set up the database by running the SQL migration in Supabase:

   - Go to your Supabase project
   - Navigate to the SQL Editor
   - Copy the contents of `src/db/schema.sql`
   - Run the SQL to create the tables and set up the schema

5. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Setup

The application uses Supabase as the database provider. The schema includes the following tables:

- `users`: Store user information
- `products`: Store product details
- `orders`: Store order information
- `order_items`: Store items within orders
- `transactions`: Store payment transaction details
- `page_views`: Store page view statistics for analytics

The complete schema is available in `src/db/schema.sql`.

## Payment Integration

### PayPal Checkout

1. Create a PayPal Developer account at [developer.paypal.com](https://developer.paypal.com)
2. Create a new app in the PayPal Developer Dashboard
3. Get your Client ID and Secret
4. Set up a webhook with the following events:
   - PAYMENT.CAPTURE.COMPLETED
   - PAYMENT.CAPTURE.DENIED
   - PAYMENT.CAPTURE.PENDING
5. Add the webhook URL: `https://your-domain.com/api/webhooks/paypal`
6. Add the Client ID, Secret, and Webhook ID to your environment variables

### M-Pesa Integration (Optional)

1. Create a Safaricom Developer account at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create a new app in the Daraja API portal
3. Get your Consumer Key, Consumer Secret, and Shortcode
4. Set up a callback URL: `https://your-domain.com/api/webhooks/mpesa`
5. Add the credentials to your environment variables

## Testing Webhooks Locally

You can test the payment webhooks locally using tools like Postman or curl.

### PayPal Webhook Test

```bash
curl -X POST http://localhost:3000/api/webhooks/paypal \
  -H "Content-Type: application/json" \
  -H "Paypal-Transmission-Id: test-transmission-id" \
  -H "Paypal-Transmission-Time: 2023-01-01T12:00:00Z" \
  -H "Paypal-Transmission-Sig: test-signature" \
  -H "Paypal-Auth-Algo: SHA256withRSA" \
  -H "Paypal-Cert-Url: https://api.sandbox.paypal.com/v1/notifications/certs/cert_key_id" \
  -d '{
    "event_type": "PAYMENT.CAPTURE.COMPLETED",
    "resource": {
      "id": "test-payment-id",
      "status": "COMPLETED",
      "amount": {
        "total": "100.00",
        "currency": "USD"
      },
      "custom_id": "ORD-12345"
    }
  }'
```

### M-Pesa Webhook Test

```bash
curl -X POST http://localhost:3000/api/webhooks/mpesa \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "test-request-id",
        "CheckoutRequestID": "test-checkout-id",
        "ResultCode": 0,
        "ResultDesc": "The service request is processed successfully.",
        "CallbackMetadata": {
          "Item": [
            {
              "Name": "Amount",
              "Value": 100.00
            },
            {
              "Name": "MpesaReceiptNumber",
              "Value": "TEST12345"
            },
            {
              "Name": "TransactionDate",
              "Value": 20230101120000
            },
            {
              "Name": "PhoneNumber",
              "Value": 254712345678
            }
          ]
        }
      }
    }
  }'
```

## Deployment

The application is designed to be deployed on Vercel.

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Deploy the application:
   ```bash
   vercel
   ```
4. Add the environment variables in the Vercel dashboard

## Project Structure

```
worldsamma-shop/
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── (admin)/    # Admin routes
│   │   ├── (store)/    # Store routes
│   │   ├── api/        # API routes
│   │   ├── globals.css # Global styles
│   │   └── layout.tsx  # Root layout
│   ├── components/     # React components
│   │   ├── admin/      # Admin components
│   │   ├── layout/     # Layout components
│   │   ├── ui/         # UI components
│   │   └── ...
│   ├── db/             # Database schema and migrations
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries
│   │   ├── supabase/   # Supabase client
│   │   └── ...
│   └── utils/          # Utility functions
├── .env.example        # Example environment variables
├── .gitignore          # Git ignore file
├── components.json     # ShadCN UI components config
├── next.config.js      # Next.js configuration
├── package.json        # Project dependencies
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Supabase](https://supabase.io/)
- [PayPal](https://developer.paypal.com/)
- [M-Pesa](https://developer.safaricom.co.ke/)
- [Vercel](https://vercel.com/)
