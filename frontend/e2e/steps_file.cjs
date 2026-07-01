// in this file you can append custom step methods to 'I' object

module.exports = function() {
  return actor({
    /** Auto-accept window.alert / window.confirm (FamilyProfile, Admin flows). */
    async acceptBrowserDialogs() {
      await this.usePlaywrightTo('accept browser dialogs', async ({ page }) => {
        page.on('dialog', async (dialog) => {
          await dialog.accept();
        });
      });
    },
  });
}
