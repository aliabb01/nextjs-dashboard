"use server";

/**
 * ? NOTE:
 * Having "use server" in this file, marks
 * all exported functions within it as server functions.
 *
 * These server functions can then be imported into Client
 * and Server components, making them extremely versatile.
 */

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const InvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(["pending", "paid"]),
    date: z.string(),
});

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    // ? NOTE:
    // When working with many fields, you can use this
    // const rawFormData = Object.fromEntries(formData.entries())

    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];

    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");

    // Test it out:
    // console.log(rawFormData);
}

// Use Zod to update the expected types
const UpdateInvoice = InvoiceSchema.omit({ date: true });

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    });

    const amountInCents = amount * 100;

    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;

    // ? NOTE:
    // Since this function is called in dashboard/invoices path, you don't need to call redirect.
    // Calling revalidatePath will trigger a new server request and re-render the table
    revalidatePath("/dashboard/invoices");
}
