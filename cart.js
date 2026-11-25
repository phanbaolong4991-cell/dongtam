/* =========================================
   ĐỒNG TÂM D&T COFFEE - GIỎ HÀNG
   - Khách thêm sản phẩm vào giỏ, tiếp tục xem web.
   - Giỏ hàng được nhớ trong trình duyệt của khách (localStorage).
   - Khi đặt hàng, đơn được soạn sẵn và mở Zalo của cửa hàng.
========================================= */
(function () {
  'use strict';

  // ---------- CẤU HÌNH (chỉ sửa ở đây) ----------
  var CONFIG = {
    // Số Zalo nhận đơn, viết liền không dấu cách. Ví dụ: '0338851369'
    zaloPhone: '',
    // Số điện thoại hiển thị khi cần khách gọi trực tiếp
    hotline: '0338 851 369',
    storeName: 'Đồng Tâm D&T Coffee'
  };

  var STORAGE_KEY = 'dt_cart_v1';
  var MAX_QTY = 99;

  // ---------- TIỆN ÍCH ----------
  function formatMoney(n) {
    return Number(n).toLocaleString('vi-VN') + 'đ';
  }

  function parsePrice(text) {
    var m = /([\d.]+)\s*đ/.exec(text || '');
    return m ? parseInt(m[1].replace(/\./g, ''), 10) : NaN;
  }

  function isValidPhone(value) {
    var digits = String(value).replace(/[\s.\-()]/g, '');
    return /^(\+?84|0)\d{8,10}$/.test(digits);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // ---------- LƯU GIỎ HÀNG ----------
  var cart = load();

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter(function (i) {
        return i && typeof i.id === 'string' && typeof i.name === 'string' &&
          typeof i.label === 'string' &&
          isFinite(i.price) && i.price > 0 && i.qty >= 1 && i.qty <= MAX_QTY;
      });
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) { /* trình duyệt chặn lưu: giỏ vẫn dùng được trong trang này */ }
  }

  function totalQty() {
    return cart.reduce(function (s, i) { return s + i.qty; }, 0);
  }

  function totalMoney() {
    return cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  }

  // ---------- GIAO DIỆN ----------
  var header = document.querySelector('.header-container');
  if (!header) return;

  // Nút giỏ hàng trên thanh menu
  var cartBtn = el('button', 'cart-btn');
  cartBtn.type = 'button';
  cartBtn.setAttribute('aria-haspopup', 'dialog');
  cartBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>' +
    '<path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"></path></svg>';
  var countBadge = el('span', 'cart-count');
  countBadge.setAttribute('aria-hidden', 'true');
  cartBtn.appendChild(countBadge);
  header.appendChild(cartBtn);

  // Lớp phủ + ngăn kéo giỏ hàng
  var overlay = el('div', 'cart-overlay');
  var drawer = el('aside', 'cart-drawer');
  drawer.id = 'cartDrawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-labelledby', 'cartTitle');
  drawer.setAttribute('aria-hidden', 'true');

  var head = el('div', 'cart-head');
  var title = el('h2', null, 'Giỏ hàng');
  title.id = 'cartTitle';
  var closeBtn = el('button', 'cart-close', '×');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Đóng giỏ hàng');
  head.appendChild(title);
  head.appendChild(closeBtn);

  var body = el('div', 'cart-body');

  var emptyBox = el('div', 'cart-empty');
  emptyBox.appendChild(el('p', null, 'Giỏ hàng đang trống.'));
  var shopLink = el('a', 'btn', 'Xem sản phẩm');
  shopLink.href = 'san-pham.html';
  emptyBox.appendChild(shopLink);

  var filled = el('div', 'cart-filled');
  var list = el('ul', 'cart-items');
  var totalRow = el('div', 'cart-total');
  var totalLabel = el('span', null, 'Tạm tính');
  var totalValue = el('strong', null, '0đ');
  totalRow.appendChild(totalLabel);
  totalRow.appendChild(totalValue);
  var clearBtn = el('button', 'cart-clear', 'Xóa toàn bộ giỏ hàng');
  clearBtn.type = 'button';

  var form = el('form', 'cart-form');
  form.noValidate = true;
  form.appendChild(el('h3', null, 'Thông tin nhận hàng'));

  function field(name, placeholder, type, autocomplete, tag) {
    var input = el(tag || 'input');
    if (!tag) input.type = type || 'text';
    input.name = name;
    input.placeholder = placeholder;
    input.setAttribute('aria-label', placeholder.replace(/\s*\(\*\)/, ''));
    if (autocomplete) input.autocomplete = autocomplete;
    if (tag === 'textarea') input.rows = 2;
    input.maxLength = tag === 'textarea' ? 500 : 150;
    form.appendChild(input);
    return input;
  }
  field('name', 'Họ và tên (*)', 'text', 'name');
  field('phone', 'Số điện thoại (*)', 'tel', 'tel').inputMode = 'tel';
  field('address', 'Địa chỉ nhận hàng (*)', 'text', 'street-address');
  field('note', 'Ghi chú (nếu có)', 'text', null, 'textarea');

  var submitBtn = el('button', 'btn cart-submit');
  submitBtn.type = 'submit';
  form.appendChild(submitBtn);

  var msg = el('p', 'cart-msg');
  msg.setAttribute('role', 'status');
  msg.setAttribute('aria-live', 'polite');
  form.appendChild(msg);

  var orderBox = el('textarea', 'cart-order-text');
  orderBox.readOnly = true;
  orderBox.rows = 8;
  orderBox.hidden = true;
  orderBox.setAttribute('aria-label', 'Nội dung đơn hàng để sao chép');
  form.appendChild(orderBox);

  filled.appendChild(list);
  filled.appendChild(totalRow);
  filled.appendChild(clearBtn);
  filled.appendChild(form);
  body.appendChild(emptyBox);
  body.appendChild(filled);
  drawer.appendChild(head);
  drawer.appendChild(body);

  // Thông báo nhỏ khi vừa thêm sản phẩm
  var toast = el('div', 'cart-toast');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  var toastText = el('span');
  var toastBtn = el('button', null, 'Xem giỏ');
  toastBtn.type = 'button';
  toast.appendChild(toastText);
  toast.appendChild(toastBtn);

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
  document.body.appendChild(toast);

  // ---------- HIỂN THỊ ----------
  function render() {
    var qty = totalQty();
    countBadge.textContent = qty > 99 ? '99+' : String(qty);
    countBadge.hidden = qty === 0;
    cartBtn.setAttribute('aria-label',
      qty === 0 ? 'Giỏ hàng, đang trống' : 'Giỏ hàng, ' + qty + ' sản phẩm');

    emptyBox.hidden = qty !== 0;
    filled.hidden = qty === 0;
    submitBtn.textContent = CONFIG.zaloPhone ? 'Gửi đơn qua Zalo' : 'Sao chép đơn hàng';

    list.textContent = '';
    cart.forEach(function (item) {
      var li = el('li', 'cart-item');

      var info = el('div', 'cart-item-info');
      info.appendChild(el('strong', null, item.name));
      info.appendChild(el('span', null, item.label));

      var controls = el('div', 'cart-qty');
      var minus = el('button', null, '−');
      minus.type = 'button';
      minus.dataset.act = 'dec';
      minus.dataset.id = item.id;
      minus.setAttribute('aria-label', 'Giảm số lượng ' + item.name);
      var num = el('span', null, String(item.qty));
      num.setAttribute('aria-label', 'Số lượng ' + item.qty);
      var plus = el('button', null, '+');
      plus.type = 'button';
      plus.dataset.act = 'inc';
      plus.dataset.id = item.id;
      plus.setAttribute('aria-label', 'Tăng số lượng ' + item.name);
      controls.appendChild(minus);
      controls.appendChild(num);
      controls.appendChild(plus);

      var line = el('div', 'cart-item-line', formatMoney(item.price * item.qty));

      var remove = el('button', 'cart-remove', 'Xóa');
      remove.type = 'button';
      remove.dataset.act = 'del';
      remove.dataset.id = item.id;
      remove.setAttribute('aria-label', 'Xóa ' + item.name + ' khỏi giỏ hàng');

      li.appendChild(info);
      li.appendChild(controls);
      li.appendChild(line);
      li.appendChild(remove);
      list.appendChild(li);
    });
    totalValue.textContent = formatMoney(totalMoney());
  }

  // ---------- THAO TÁC GIỎ ----------
  function addItem(id, name, price, label) {
    var found = cart.filter(function (i) { return i.id === id; })[0];
    if (found) {
      found.qty = Math.min(MAX_QTY, found.qty + 1);
      found.price = price;
      found.label = label;
    } else {
      cart.push({ id: id, name: name, price: price, label: label, qty: 1 });
    }
    save();
    render();
  }

  function changeQty(id, delta) {
    cart.forEach(function (i) {
      if (i.id === id) i.qty = Math.max(1, Math.min(MAX_QTY, i.qty + delta));
    });
    save();
    render();
  }

  function removeItem(id) {
    cart = cart.filter(function (i) { return i.id !== id; });
    save();
    render();
  }

  // ---------- MỞ / ĐÓNG NGĂN KÉO ----------
  var lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    hideToast();
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-lock');
    closeBtn.focus();
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function isOpen() {
    return drawer.classList.contains('open');
  }

  var toastTimer = null;
  function showToast(text) {
    toastText.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 3500);
  }
  function hideToast() {
    toast.classList.remove('show');
  }

  // ---------- SỰ KIỆN ----------
  cartBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  toastBtn.addEventListener('click', openDrawer);

  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      closeDrawer();
      return;
    }
    if (e.key === 'Tab') {
      var focusable = drawer.querySelectorAll(
        'button:not([disabled]), a[href], input, textarea:not([hidden])');
      focusable = Array.prototype.filter.call(focusable, function (n) {
        return n.offsetParent !== null;
      });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var id = btn.dataset.id;
    if (btn.dataset.act === 'inc') changeQty(id, 1);
    if (btn.dataset.act === 'dec') changeQty(id, -1);
    if (btn.dataset.act === 'del') removeItem(id);
    // giữ nguyên vị trí con trỏ trên nút vừa bấm nếu còn tồn tại
    var again = list.querySelector('button[data-act="' + btn.dataset.act + '"][data-id="' + id + '"]');
    if (again) again.focus(); else closeBtn.focus();
  });

  clearBtn.addEventListener('click', function () {
    if (window.confirm('Xóa toàn bộ sản phẩm trong giỏ hàng?')) {
      cart = [];
      save();
      msg.textContent = '';
      orderBox.hidden = true;
      render();
      closeBtn.focus();
    }
  });

  // Nút "Thêm Vào Giỏ" trên trang Sản Phẩm
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    var card = btn.closest('.product-card');
    if (!card) return;
    var nameEl = card.querySelector('h3');
    var priceEl = card.querySelector('.product-price');
    var name = nameEl ? nameEl.textContent.trim() : '';
    var label = priceEl ? priceEl.textContent.trim() : '';
    var price = parsePrice(label);
    var id = btn.dataset.id || name;
    if (!name || !isFinite(price)) return;
    addItem(id, name, price, label);
    showToast('Đã thêm "' + name + '" vào giỏ hàng');
    cartBtn.classList.remove('bump');
    void cartBtn.offsetWidth;
    cartBtn.classList.add('bump');
  });

  // Giữ giỏ hàng đồng bộ giữa các thẻ/tab đang mở
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) {
      cart = load();
      render();
    }
  });

  // ---------- GỬI ĐƠN ----------
  function buildOrderText(data) {
    var lines = [];
    lines.push('ĐƠN HÀNG TỪ WEBSITE ' + CONFIG.storeName.toUpperCase());
    lines.push('');
    lines.push('Khách hàng: ' + data.name);
    lines.push('Số điện thoại: ' + data.phone);
    lines.push('Địa chỉ nhận hàng: ' + data.address);
    if (data.note) lines.push('Ghi chú: ' + data.note);
    lines.push('');
    lines.push('Sản phẩm:');
    cart.forEach(function (i, idx) {
      lines.push((idx + 1) + '. ' + i.name + ' (' + i.label + ') x ' + i.qty +
        ' = ' + formatMoney(i.price * i.qty));
    });
    lines.push('');
    lines.push('Tạm tính: ' + formatMoney(totalMoney()));
    return lines.join('\n');
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        orderBox.hidden = false;
        orderBox.value = text;
        orderBox.select();
        var ok = document.execCommand('copy');
        ok ? resolve() : reject();
      } catch (err) { reject(err); }
    });
  }

  function setMsg(type, text) {
    msg.className = 'cart-msg ' + type;
    msg.textContent = text;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!cart.length) return;

    var data = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      address: form.elements.address.value.trim(),
      note: form.elements.note.value.trim()
    };

    if (!data.name) {
      setMsg('error', 'Vui lòng nhập họ và tên.');
      form.elements.name.focus();
      return;
    }
    if (!isValidPhone(data.phone)) {
      setMsg('error', 'Số điện thoại chưa đúng. Vui lòng nhập số điện thoại Việt Nam, ví dụ ' + CONFIG.hotline + '.');
      form.elements.phone.focus();
      return;
    }
    if (!data.address) {
      setMsg('error', 'Vui lòng nhập địa chỉ nhận hàng.');
      form.elements.address.focus();
      return;
    }

    var text = buildOrderText(data);
    orderBox.value = text;

    // Mở Zalo ngay trong lúc khách bấm nút (để trình duyệt không chặn cửa sổ mới)
    var zaloUrl = CONFIG.zaloPhone
      ? 'https://zalo.me/' + CONFIG.zaloPhone.replace(/\D/g, '')
      : '';
    if (zaloUrl) window.open(zaloUrl, '_blank', 'noopener');

    copyText(text).then(function () {
      orderBox.hidden = true;
      if (zaloUrl) {
        setMsg('success', 'Đã sao chép đơn hàng. Zalo đang mở: hãy dán (Ctrl+V, hoặc nhấn giữ rồi chọn Dán) vào khung chat và bấm gửi.');
      } else {
        setMsg('success', 'Đã sao chép đơn hàng. Vui lòng gửi cho cửa hàng, hoặc gọi ' + CONFIG.hotline + '.');
      }
    }).catch(function () {
      orderBox.hidden = false;
      setMsg('info', 'Chưa tự sao chép được. Vui lòng chọn và sao chép nội dung đơn hàng bên dưới, rồi gửi cho cửa hàng.');
    });
  });

  render();
})();
