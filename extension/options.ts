var browser: Browser = browser || chrome;

browser.storage.local.get(['theme'], obj => {

    var theme: string = obj.theme || 'green-red';
    var themeSettingsContainer = document.getElementById('theme-settings');

    [
        'green-red',
        'purple-yellow',
        'cyan-orange',
    ].map(x => {
        themeSettingsContainer.insertAdjacentHTML('beforeend', `
        <label class="shinigami-eyes-theme shinigami-eyes-theme-${x}">
        <input type="radio" name="selected-theme" ${x == theme ? 'checked' : ''} data-theme="${x}">
        <span class="assigned-label-t-friendly">T-Friendly</span>,
        <span class="assigned-label-transphobic">Anti-trans</span>,
        <span class="assigned-label-unknown" title="Using Facebook as an example for unknown links.">Unknown (fb)</span>
        </label>
        `);
    });

});

document.getElementById('save-button').addEventListener('click', async () => {
    var theme = (<HTMLInputElement>
        [...document.querySelectorAll('.shinigami-eyes-theme input')]
            .filter(x => (<HTMLInputElement>x).checked)[0]
    ).dataset.theme;
    browser.runtime.sendMessage(<ShinigamiEyesCommand>{ closeCallingTab: true, setTheme: theme }, () => { });
});


document.getElementById('cancel-button').addEventListener('click', async () => {
    browser.runtime.sendMessage(<ShinigamiEyesCommand>{ closeCallingTab: true }, () => { });
});
