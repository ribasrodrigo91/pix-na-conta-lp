const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // SUBSTITUA PELA SUA CHAVE REAL
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

function doPost(e) {
  // Garante que a requisição é um POST e tem conteúdo
  if (e.postData.type === "application/json") {
    const data = JSON.parse(e.postData.contents);
    
    const userEmail = data.userEmail; // E-mail do usuário vindo do formulário do thank-you.html
    const productType = data.productType; // Tipo de produto (plano-magico ou ads-ai)
    const formData = data; // Todos os dados do formulário, incluindo os específicos do produto

    Logger.log(`Requisição recebida para ${productType} de ${userEmail}`);
    Logger.log(`Dados do formulário: ${JSON.stringify(formData)}`);

    let prompt = "";
    let productTitle = "";
    let downloadLink = ""; // Para o caso de um material complementar

    if (productType === 'plano-magico') {
      productTitle = "Seu Plano Mágico Financeiro Personalizado";
      // Construindo o prompt para o Plano Mágico Financeiro
      prompt = `Crie um plano financeiro personalizado para uma pessoa com as seguintes informações:
      Renda Mensal: R$${formData.rendaMensal}
      Despesas Fixas Mensais: R$${formData.despesasFixas}
      Valor Total das Dívidas: R$${formData.valorDividas}
      Objetivo Financeiro Principal: ${formData.objetivoFinanceiro === 'outro' ? formData.outroObjetivo : formData.objetivoFinanceiro}
      Maior Desafio Financeiro: ${formData.maiorDesafio}

      O plano deve ser amigável, sem jargões, focado em simplicidade e ação. Inclua:
      1. Um diagnóstico rápido e motivador.
      2. Sugestões de orçamento simplificadas (ex: regra 50/30/20 adaptada).
      3. Estratégias para quitação de dívidas (ex: bola de neve ou avalanche, explicando de forma simples).
      4. 3 a 5 dicas práticas e personalizadas para o dia a dia.
      5. Conclua com uma mensagem de encorajamento.`;

      // Se houver um material complementar para o plano financeiro
      downloadLink = "https://link.para.seu.material.plano.magico.com/download"; // SUBSTITUA PELO LINK REAL DO MATERIAL COMPLEMENTAR

    } else if (productType === 'ads-ai') {
      productTitle = "Seus Anúncios Personalizados Gerados por IA";
      // Construindo o prompt para o Gerador de Anúncios com IA
      prompt = `Gere 3 opções de textos de anúncios curtos e persuasivos para o negócio/serviço:
      Nome do Negócio/Serviço: ${formData.nomeNegocio}
      Público-Alvo: ${formData.publicoAlvo}
      Objetivo Principal do Anúncio: ${formData.objetivoAnuncio === 'outro' ? formData.outroObjetivoAnuncio : formData.objetivoAnuncio}
      Principais Pontos de Venda: ${formData.pontosVenda}
      Tom Desejado para o Anúncio: ${formData.tomAnuncio === 'outro' ? formData.outroTomAnuncio : formData.tomAnuncio}

      Os anúncios devem ser criativos, diretos e otimizados para plataformas como Meta Ads. Inclua um Call to Action claro para cada um.`;

      // Se houver um material complementar para o guia de anúncios
      downloadLink = "https://link.para.seu.material.anuncios.ia.com/download"; // SUBSTITUA PELO LINK REAL DO MATERIAL COMPLEMENTAR
    }

    if (prompt) {
      try {
        const generatedContent = generateContentWithGemini(prompt);
        sendPersonalizedEmail(userEmail, productTitle, generatedContent, downloadLink);
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Content generated and email sent' })).setMimeType(ContentService.MimeType.JSON);
      } catch (error) {
        Logger.log('Erro ao gerar conteúdo ou enviar e-mail: ' + error.toString());
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Failed to generate content or send email', details: error.toString() })).setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid product type' })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid request type' })).setMimeType(ContentService.MimeType.JSON);
}

function generateContentWithGemini(prompt) {
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true // Para capturar erros da API
  };

  const response = UrlFetchApp.fetch(GEMINI_API_URL, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode === 200) {
    const jsonResponse = JSON.parse(responseBody);
    if (jsonResponse.candidates && jsonResponse.candidates[0] && jsonResponse.candidates[0].content && jsonResponse.candidates[0].content.parts && jsonResponse.candidates[0].content.parts[0]) {
      return jsonResponse.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Resposta da Gemini API inválida ou vazia.');
    }
  } else {
    throw new Error(`Erro na Gemini API: Código ${responseCode}, Resposta: ${responseBody}`);
  }
}

function sendPersonalizedEmail(recipientEmail, productTitle, content, downloadLink) {
  let emailBody = `Olá!

Obrigado por sua compra. Aqui está o seu ${productTitle}:

---
${content}
---
`;

  if (downloadLink && downloadLink !== "https://link.para.seu.material.plano.magico.com/download" && downloadLink !== "https://link.para.seu.material.anuncios.ia.com/download") {
    emailBody += `

Você também pode acessar um material complementar aqui: ${downloadLink}`;
  }

  emailBody += `

Qualquer dúvida, estamos à disposição.

Atenciosamente,
Sua Equipe`;

  MailApp.sendEmail(recipientEmail, `Seu ${productTitle} Chegou!`, emailBody);
  Logger.log('Email personalizado enviado para: ' + recipientEmail);
}