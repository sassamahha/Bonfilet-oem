import { NextResponse } from 'next/server';

import { createQuote } from '@/lib/quote';
import { QuoteValidationError } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const quote = await createQuote(payload);
    return NextResponse.json(quote);
  } catch (error) {
    if (error instanceof QuoteValidationError) {
      return NextResponse.json(error.body, { status: 400 });
    }

    console.error('Failed to generate quote', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
