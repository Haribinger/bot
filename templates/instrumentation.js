export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { register } = await import('@harbinger-ai/harbinger/instrumentation');
    await register();
  }
}
