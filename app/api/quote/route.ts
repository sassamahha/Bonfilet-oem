import { NextResponse } from 'next/server';
import { createQuote } from '@/lib/quote';
import { QuoteValidationError } from '@/lib/validation';

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  try {
    const quote = await createQuote(body);
    return NextResponse.json(quote);
  } catch (error) {
    if (error instanceof QuoteValidationError) {
      return NextResponse.json(error.body, { status: error.status });
    }

    return NextResponse.json(
      { message: 'Unable to create quote', errors: ['Unable to create quote'], needsReview: false },
      { status: 500 }
    );
  }
}
