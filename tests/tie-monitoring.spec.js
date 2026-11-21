import { test } from '@playwright/test';
import 'dotenv/config';

async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Telegram error: ${data.description}`);
  }
}

async function checkAppointments(browser) {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  try {
    console.log('Проверяю TIE...');

    await page.goto(
      'https://icp.administracionelectronica.gob.es/icpplus/index.html',
      {
        timeout: 30000,
      }
    );

    const fortiGateBlocked = await page
      .getByText('FortiGate Intrusion Prevention')
      .isVisible();

    if (fortiGateBlocked) {
      throw new Error('Сайт заблокирован FortiGate');
    }

    await page
      .getByRole('combobox', { name: 'PROVINCIAS DISPONIBLES' })
      .selectOption({ label: 'Madrid' });

    await page
      .getByRole('button', { name: 'Aceptar' })
      .click();

    await page.waitForURL(/citar/, {
      timeout: 20000,
    });

    await page
  .getByRole('combobox')
  .nth(0)
  .selectOption({ label: 'Cualquier oficina' });

await page
  .getByRole('combobox')
  .nth(1)
  .selectOption({ label: 'INFORMACIÓN PRESENCIAL' });

    await page
      .getByRole('combobox')
      .nth(2)
      .selectOption({
        label:
          'POLICÍA-EXPEDICIÓN DE TARJETAS CUYA AUTORIZACIÓN RESUELVE LA DIRECCIÓN GENERAL DE GESTIÓN MIGRATORIA',
      });

    await page
      .getByRole('button', { name: 'Aceptar' })
      .click();

    await page.waitForURL(/acInfo/, {
      timeout: 20000,
    });

    await page
      .getByRole('button', { name: 'Entrar' })
      .click();

    await page.waitForURL(/acEntrada/, {
      timeout: 20000,
    });

    await page
      .getByRole('textbox', {
        name: '* N.I.E. Campo obligatorio',
      })
      .fill(process.env.NIE);

    await page
      .getByRole('textbox', {
        name: '*Nombre y apellidos Campo obligatorio',
      })
      .fill(process.env.FULL_NAME);

    await page
      .getByRole('button', { name: 'Aceptar' })
      .click();

    await page.waitForURL(/acValidarEntrada/, {
      timeout: 20000,
    });

    const noSlotsMessage = page.getByText(
      /En este momento no hay citas disponibles/
    );

    const solicitarCitaButton = page.getByRole('button', {
      name: 'Solicitar Cita',
    });

    if (await noSlotsMessage.isVisible()) {
      console.log('Мест нет.');
      return 'no-slots';
    }

    if (await solicitarCitaButton.isVisible()) {
      await solicitarCitaButton.click();

      const noSlotsAfterClick = await noSlotsMessage
        .waitFor({
          state: 'visible',
          timeout: 10000,
        })
        .then(() => true)
        .catch(() => false);

      if (noSlotsAfterClick) {
        console.log('Мест нет.');
        return 'no-slots';
      }
    }

    console.log('Возможно, появились места!');
    return 'possible-slots';
  } finally {
    await context.close();
  }
}

test('TIE appointment monitor', async ({ browser }) => {
  // Монитор работает постоянно, поэтому обычный таймаут теста отключаем.
  test.setTimeout(0);

  let alertSent = false;

  while (true) {
    try {
      const result = await checkAppointments(browser);

      if (result === 'possible-slots' && !alertSent) {
        await sendTelegramMessage(
          '🚨 Возможно, появилась запись на TIE – Gestión Migratoria!'
        );

        alertSent = true;
      }

      if (result === 'no-slots') {
        alertSent = false;
      }
    } catch (error) {
      console.log(`Ошибка проверки: ${error.message}`);
      console.log('Попробую снова через 20 минут.');
    }

    console.log('Следующая проверка через 20 минут.');

    await new Promise((resolve) => {
      setTimeout(resolve,  60* 60 * 1000);
    });
  }
});