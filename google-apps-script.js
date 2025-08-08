const SPREADSHEET_ID = '1t33EBbG6uWAHz9BqyTgmU2fM4anLmAh_DC3ldNYQClg';
const SHEET_NAME = 'Registro'; // Nome da aba atualizado para 'Registro'

function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const paymentId = params.data.id; // ID do pagamento no Mercado Pago
  const topic = params.topic; // Tipo de evento (ex: payment)

  // Log para depuração - remova em produção se não for necessário
  Logger.log('Webhook recebido: ' + JSON.stringify(params));

  let clientEmail = '';
  let productTitle = '';
  let downloadLink = '';
  let paymentStatus = 'pending'; // Status inicial
  let downloadLinkSent = 'No';

  if (topic === 'payment' && paymentId) {
    // Em um cenário real, você faria uma requisição para a API do MP para confirmar o status
    // Por enquanto, vamos assumir que se chegou aqui, o pagamento está sendo processado ou aprovado
    paymentStatus = params.data.status || 'unknown'; // Pega o status real do MP

    // O e-mail do comprador pode vir em diferentes lugares dependendo da configuração do MP
    // params.resource.payer.email é o mais comum para links de pagamento
    clientEmail = params.resource.payer.email || 'email_nao_disponivel';

    // Lógica para identificar o produto com base na descrição do Mercado Pago
    // Você pode ajustar isso conforme a descrição que você colocou nos links do MP
    if (params.resource.description.includes("Plano Mágico Financeiro")) {
        productTitle = "Plano Mágico Financeiro";
        downloadLink = "https://link.para.seu.material.plano.magico.com/download"; // SUBSTITUA PELO LINK REAL
    } else if (params.resource.description.includes("Crie Anúncios com IA")) {
        productTitle = "Guia Crie Anúncios com IA";
        downloadLink = "https://link.para.seu.material.anuncios.ia.com/download"; // SUBSTITUA PELO LINK REAL
    }

    // Se o pagamento for aprovado, envia o e-mail
    if (paymentStatus === 'approved' && clientEmail && productTitle && downloadLink) {
      sendProductEmail(clientEmail, productTitle, downloadLink);
      downloadLinkSent = 'Yes';
    }
  }

  // Registra os dados na Google Sheet
  recordDataInSheet(paymentId, productTitle, clientEmail, paymentStatus, downloadLinkSent, JSON.stringify(params));

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Webhook processed' })).setMimeType(ContentService.MimeType.JSON);
}

function sendProductEmail(recipientEmail, productTitle, downloadLink) {
  const subject = `Seu ${productTitle} Chegou!`;
  const body = `Olá!

Obrigado por sua compra do ${productTitle}.

Você pode acessar seu material aqui: ${downloadLink}

Qualquer dúvida, estamos à disposição.

Atenciosamente,
Sua Equipe`;

  MailApp.sendEmail(recipientEmail, subject, body);
  Logger.log('Email enviado para: ' + recipientEmail);
}

function recordDataInSheet(paymentId, productTitle, clientEmail, paymentStatus, downloadLinkSent, mpData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const timestamp = new Date();
  
  sheet.appendRow([
    timestamp,
    paymentId,
    productTitle,
    clientEmail,
    paymentStatus,
    downloadLinkSent,
    mpData
  ]);
  Logger.log('Dados registrados na planilha.');
}