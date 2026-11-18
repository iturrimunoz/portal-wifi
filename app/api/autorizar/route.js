import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function POST(request) {
  try {
    const { email, password, clientIp } = await request.json();

    if (!clientIp) {
      return NextResponse.json(
        { error: 'No se detectó la IP local del dispositivo.' },
        { status: 400 }
      );
    }

    // 1. Validar credenciales en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    // 2. Verificar si el usuario tiene perfil activo (opcional si creaste perfiles_usuarios)
    const { data: perfil } = await supabase
      .from('perfiles_usuarios')
      .select('activo')
      .eq('id', authData.user.id)
      .single();

    if (perfil && perfil.activo === false) {
      return NextResponse.json(
        { error: 'Tu cuenta se encuentra suspendida.' },
        { status: 403 }
      );
    }

    // 3. Autorizar IP en la REST API del MikroTik
    const authHeader = Buffer.from(
      `${process.env.MIKROTIK_USER}:${process.env.MIKROTIK_PASS}`
    ).toString('base64');

    await axios.put(
      `${process.env.MIKROTIK_API_URL}/ip/firewall/address-list`,
      {
        address: clientIp,
        list: 'usuarios_autorizados',
        timeout: '04:00:00',
        comment: `WebAuth: ${email}`,
      },
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    return NextResponse.json({
      success: true,
      message: '¡Acceso concedido! Ya puedes navegar.',
    });
  } catch (err) {
    console.error('Error en autorización:', err.response?.data || err.message);
    return NextResponse.json(
      { error: 'No se pudo comunicar con el router. Intenta nuevamente.' },
      { status: 500 }
    );
  }
}