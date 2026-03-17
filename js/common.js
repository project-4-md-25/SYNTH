function setActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === page || (page === 'index' && (href === '/' || href === 'index.html' || href === '#'))) {
      link.classList.add('active');
    }
  });
}
