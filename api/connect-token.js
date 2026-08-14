export default async function handler(req, res) {
  // =========================================================
  // FINANCEIRO EDUARDO E VIVIANE
  // BACKEND - PLUGGY CONNECT TOKEN
  // =========================================================

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: "Credenciais da Pluggy não configuradas no servidor."
      });
    }

    // -------------------------------------------------------
    // 1. GERAR API KEY
    // -------------------------------------------------------

    const authResponse = await fetch(
      "https://api.pluggy.ai/auth",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          clientId,
          clientSecret
        })
      }
    );

    if (!authResponse.ok) {
      const erro = await authResponse.text();

      return res.status(500).json({
        error: "Falha na autenticação com a Pluggy.",
        details: erro
      });
    }

    const authData =
      await authResponse.json();

    const apiKey =
      authData.apiKey ||
      authData.accessToken;

    if (!apiKey) {
      return res.status(500).json({
        error: "Pluggy não retornou uma API Key."
      });
    }

    // -------------------------------------------------------
    // 2. CRIAR CONNECT TOKEN
    // -------------------------------------------------------

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const clientUserId =
      body.clientUserId ||
      "financeiro-eduardo-viviane";

    const tokenResponse =
      await fetch(
        "https://api.pluggy.ai/connect_token",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey
          },

          body: JSON.stringify({
            options: {
              clientUserId
            }
          })
        }
      );

    if (!tokenResponse.ok) {
      const erro =
        await tokenResponse.text();

      return res.status(500).json({
        error:
          "Falha ao criar Connect Token.",
        details: erro
      });
    }

    const tokenData =
      await tokenResponse.json();

    // -------------------------------------------------------
    // 3. DEVOLVER SOMENTE O NECESSÁRIO
    // -------------------------------------------------------

    return res.status(200).json({
      accessToken:
        tokenData.accessToken
    });

  } catch (error) {

    console.error(
      "Erro Pluggy:",
      error
    );

    return res.status(500).json({
      error:
        "Erro interno ao conectar com a Pluggy."
    });
  }
}
