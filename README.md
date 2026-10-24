# China Import Orders

Web app for tracking China import orders: an interactive spreadsheet where every order is registered, followed up and saved online to the user's account.

## What the site does

- **Order spreadsheet** with columns: Order Code, Order Content, Status (Pending / Delivered), Arrival Date (DD/MM/YYYY), Notes and Action.
- **Inline editing**: click any cell to edit it; every change is saved automatically to your account, no button to press.
- **Real-time summary**: total orders, delivered, pending and the delivered percentage, updated on every change.
- **Status made visible**: Pending and Delivered are told apart by text and by clear visual cues in the black-and-white theme.
- **Deletion with confirmation**: every row has a delete button that asks for confirmation before removing the order.
- **Private online saving**: orders are stored in the user's account (not on the computer). Each account only sees its own orders, and access requires sign-in.
- **Automatic import**: if older orders are saved in the browser, they are transferred to the account on first access, without overwriting what is already saved online.
- **Responsive**: on narrow screens the table scrolls horizontally without breaking the layout.

## How to use

1. Open the site and sign in to your account.
2. Add an order with the "New order" button — it is inserted at the top of the list.
3. Fill in code, content, status, arrival date and notes. Everything saves on its own.
4. When the package arrives, set the status to "Delivered" and enter the date.

## Technology

- TanStack Start (React 19 + TypeScript)
- Tailwind CSS v4 with Shadcn components
- Managed backend with database, authentication and server functions

## Development

```sh
npm i
npm run dev
```

Online saving relies on environment variables defined in the `.env` file (database address, public key and project identifier). Without them the site still opens, but it cannot save orders.

## Tests

```sh
npm test
```
