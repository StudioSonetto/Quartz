import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound.js";

export default defineEventHandler(async (event) => {
  const polar = usePolar();
  const user = await requireUser(event);

  try {
    const { customerPortalUrl } = await polar.customerSessions.create({
      externalCustomerId: user.id,
    });

    return sendRedirect(event, customerPortalUrl);
  } catch (err) {
    if (err instanceof ResourceNotFound)
      return sendRedirect(event, "/api/billing/checkout");
    throw err;
  }
});
