if (!customElements.get('share-button')) {
  customElements.define('share-button', class ShareButton extends DetailsDisclosure {
    constructor() {
      super();

      this.elements = {
        shareButton: this.querySelector('button'),
        shareSummary: this.querySelector('summary'),
        closeButton: this.querySelector('.share-button__close'),
        successMessage: this.querySelector('[id^="ShareMessage"]'),
        urlInput: this.querySelector('input')
      }
      this.urlToShare = this.elements.urlInput ? this.elements.urlInput.value : document.location.href;

      if (navigator.share) {
        this.mainDetailsToggle.setAttribute('hidden', '');
        this.elements.shareButton.classList.remove('hidden');
        this.elements.shareButton.addEventListener('click', () => { navigator.share({ url: this.urlToShare, title: document.title }) });
      } else {
        this.mainDetailsToggle.addEventListener('toggle', this.toggleDetails.bind(this));
        this.mainDetailsToggle.querySelector('.share-button__copy').addEventListener('click', this.copyToClipboard.bind(this));
        this.mainDetailsToggle.querySelector('.share-button__close').addEventListener('click', this.close.bind(this));
      }
    }

    toggleDetails() {
      if (!this.mainDetailsToggle.open) {
        this.elements.successMessage.classList.add('hidden');
        this.elements.successMessage.textContent = '';
        this.elements.closeButton.classList.add('hidden');
        this.elements.shareSummary.focus();
      }
    }

    copyToClipboard() {
      navigator.clipboard.writeText(this.elements.urlInput.value).then(() => {
        this.elements.successMessage.classList.remove('hidden');
        this.elements.successMessage.textContent = window.accessibilityStrings.shareSuccess;
        this.elements.closeButton.classList.remove('hidden');
        this.elements.closeButton.focus();
      });
    }

    updateUrl(url) {
      this.urlToShare = url;
      this.elements.urlInput.value = url;
    }
  });
}



if (!customElements.get('article-share')) {
  customElements.define('article-share', class ArticleShare extends HTMLElement {
    constructor() {
      super();

      console.log()

      this.buttons = this.querySelectorAll('li a')

      this.buttons.addEventListener('click', this.clickHandler.bind(this));

      console.log('this.button', this.buttons)

      // this.elements = {
      //   shareButton: this.querySelector('button'),
      //   shareSummary: this.querySelector('summary'),
      //   closeButton: this.querySelector('.share-button__close'),
      //   successMessage: this.querySelector('[id^="ShareMessage"]'),
      //   urlInput: this.querySelector('input')
      // }
      // this.urlToShare = this.elements.urlInput ? this.elements.urlInput.value : document.location.href;

      // if (navigator.share) {
      //   this.mainDetailsToggle.setAttribute('hidden', '');
      //   this.elements.shareButton.classList.remove('hidden');
      //   this.elements.shareButton.addEventListener('click', () => { navigator.share({ url: this.urlToShare, title: document.title }) });
      // } else {
      //   this.mainDetailsToggle.addEve tListener('toggle', this.toggleDetails.bind(this));
      //   this.mainDetailsToggle.querySelector('.share-button__copy').addEventListener('click', this.copyToClipboard.bind(this));
      //   this.mainDetailsToggle.querySelector('.share-button__close').addEventListener('click', this.close.bind(this));
      // }
    }

    clickHandler() {
      console.log(this)
    }

    // toggleDetails() {
    //   if (!this.mainDetailsToggle.open) {
    //     this.elements.successMessage.classList.add('hidden');
    //     this.elements.successMessage.textContent = '';
    //     this.elements.closeButton.classList.add('hidden');
    //     this.elements.shareSummary.focus();
    //   }
    // }

    // copyToClipboard() {
    //   navigator.clipboard.writeText(this.elements.urlInput.value).then(() => {
    //     this.elements.successMessage.classList.remove('hidden');
    //     this.elements.successMessage.textContent = window.accessibilityStrings.shareSuccess;
    //     this.elements.closeButton.classList.remove('hidden');
    //     this.elements.closeButton.focus();
    //   });
    // }

    // updateUrl(url) {
    //   this.urlToShare = url;
    //   this.elements.urlInput.value = url;
    // }
  });
}
