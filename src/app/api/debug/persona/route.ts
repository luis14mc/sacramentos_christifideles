import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:3000/api/personas/0826199400252');
    const data = await response.json();
    
    return NextResponse.json({
      status: 'success',
      data: data,
      keys: Object.keys(data)
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}