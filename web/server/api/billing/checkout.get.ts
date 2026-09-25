import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const polar = usePolar();
  const user = await serverSupabaseUser(event);

  if (!user) return sendRedirect(event, "/auth");

  const product = useRuntimeConfig().polarProProductId;

  if (!product)
    throw createError({
      statusCode: 500,
      statusMessage: "NUXT_POLAR_PRO_PRODUCT_ID is not set",
    });

  const origin = getRequestURL(event, {
    xForwardedHost: true,
    xForwardedProto: true,
  }).origin;

  const { url } = await polar.checkouts.create({
    products: [product],
    externalCustomerId: user.id,
    successUrl: `${origin}/atelier`,
  });

  return sendRedirect(event, url);
});
