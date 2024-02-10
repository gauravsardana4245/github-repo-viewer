document.addEventListener('DOMContentLoaded', () => {
  const userProfileElement = document.getElementById('userProfile');
  const repositoriesElement = document.getElementById('repositories');
  const paginationElement = document.getElementById('pagination');
  let repositories;

  const getUsernameFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('username');
  };

  const renderLoader = (element) => {
    element.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>';
  };


  const renderUserDetails = (user) => {
    userProfileElement.innerHTML = `
      <div class="user-box">
        <div class="d-flex avatar-div">
          <img src="${user.avatar_url}" class="avatar-img rounded-circle" alt="User Avatar">
          <div class="user-details-box d-flex flex-column justify-content-center">
            <h2>${user.login}</h2>
            <p class="bio boldText">${user.bio || 'No bio available'}</p>
            <div class="boldText">
              <i class="fa-solid fa-location-dot"></i>
              <span> ${user.location || 'Location not specified'} </span>
            </div>
            <p class="boldText user-blog-link">
              <a class="text-dark" href="${user.blog || '#'}" target="_blank">${user.blog || 'No website'}</a>
            </p>
          </div>
        </div>
        <p class="boldText">
          <i class="fa-solid fa-link"></i>
          <a class="text-dark" href="${user.html_url}" target="_blank">${user.html_url}</a>
        </p>
      </div>
    `;
  };

  const renderRepositories = (repositories) => {
    repositoriesElement.innerHTML = `
      <div class="row">
        ${repositories.map(repo => `
          <div class="col-md-5 mb-4 repo-box">
            <a href="${repo.html_url}" target="_blank" class="card-link">
              <div class="">
                <div class="card-body">
                  <h5 class="card-title">${repo.name}</h5>
                </a>
                <p class="card-text">${repo.description || 'No description'}</p>
                <p class="card-text">
                  <p class="text-muted">
                    ${Array.isArray(repo.topics) ?
                      repo.topics.map(topic => `<div class="topicBox"><span class=" mr-1 p-2">${topic}</span> </div>`).join('') :
                      'No technologies listed'
                    }
                  </p>
                </p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const slidePagination = async (currentPage, totalPages, direction) => {
    const username = getUsernameFromURL();
    const pageRange = 10;

    const calculateNewPageRange = (currentPage, totalPages, pageRange, direction) => {
      let start, end;

      if (direction === 'older') {
        start = Math.max(1, currentPage - pageRange + 1);
        end = Math.min(totalPages, start + pageRange - 1);
      } else if (direction === 'newer') {
        start = Math.max(1, currentPage + pageRange - 1);
        end = Math.min(totalPages, start + pageRange - 1);
      }

      return { start, end };
    };


    const { start, end } = calculateNewPageRange(currentPage, totalPages, pageRange, direction);

    const response = await fetch(`https://api.github.com/users/${username}/repos?page=${start}&per_page=10`);
    const repositories = await response.json();

    renderRepositories(repositories);

    currentPage = start;

    renderPagination(currentPage, totalPages, start, end);

    const newUrl = `?username=${username}&page=${currentPage}`;
    window.history.pushState({}, '', newUrl);
  };

  window.slidePagination = slidePagination;

  const renderPagination = (currentPage, totalPages, start = null, end = null) => {
    const username = getUsernameFromURL();
    const pageRange = 10;

    if (start === null || end === null) {
      const calculatePageRange = (currentPage, totalPages, pageRange) => {
        const calculatedStart = Math.max(1, currentPage - Math.floor(pageRange / 2));
        const calculatedEnd = Math.min(totalPages, calculatedStart + pageRange - 1);
        return { start: calculatedStart, end: calculatedEnd };
      };

      const calculatedPageRange = calculatePageRange(currentPage, totalPages, pageRange);
      start = calculatedPageRange.start;
      end = calculatedPageRange.end;
    } else {
      currentPage = start;
    }

    const showOlder = start > 1;
    const showNewer = end < totalPages;

    paginationElement.innerHTML = `
      <nav aria-label="Page navigation">
        <ul class="pagination justify-content-center">
          <li class="page-item ${currentPage === 1 ? 'disabled' : ''} colorBlue">
            <a class="page-link" href="?username=${username}&page=${currentPage - 1}" aria-label="Previous">
              <span aria-hidden="true">&laquo;</span>
            </a>
          </li>
          ${Array.from({ length: end - start + 1 }, (_, index) => start + index).map(page => `
            <li class="page-item ${currentPage === page ? 'active' : ''} colorBlue">
              <a class="page-link colorBlue" href="?username=${username}&page=${page}">${page}</a>
            </li>
          `).join('')}
          <li class="page-item ${currentPage === totalPages ? 'disabled' : ''} colorBlue">
            <a class="page-link colorBlue" href="?username=${username}&page=${currentPage + 1}" aria-label="Next">
              <span aria-hidden="true">&raquo;</span>
            </a>
          </li>
        </ul>
        <div class="outerps">
          <div class=" paginatorSlider mt-2">
            <div class="innerps">
              <button class="btn sliderbtn ${showOlder ? '' : 'disabled'}" onclick="slidePagination(${currentPage},${totalPages},'older')">
                <i class="fa-solid fa-arrow-left-long"></i> Older
              </button>
              <button class="btn sliderbtn ${showNewer ? '' : 'disabled'}" onclick="slidePagination(${currentPage},${totalPages},'newer')">
                Newer <i class="fa-solid fa-arrow-right-long"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>
    `;
    setTimeout(()=> {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    },1000)
  };


  const fetchData = async () => {
    const username = getUsernameFromURL();

    if (!username) {
      console.error('Username not found in the URL parameters');
      return;
    }

    try {
      console.log("username: ", username)
      renderLoader(userProfileElement);
      const user = await fetch(`https://api.github.com/users/${username}`).then(response => response.json());
      renderUserDetails(user);

      renderLoader(repositoriesElement);
      
      const page = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
      const perPage = 10;
      const response = await fetch(`https://api.github.com/users/${username}/repos?page=${page}&per_page=${perPage}`);
      repositories = await response.json();
      console.log("repositories: ", repositories);
      const totalPages = Math.ceil(user.public_repos / perPage);
      renderRepositories(repositories);

      renderPagination(page, totalPages);
    } catch (error) {
      console.error('Error fetching data:', error);
      userProfileElement.innerHTML = '<p class="text-danger">Error fetching user data</p>';
      repositoriesElement.innerHTML = '<p class="text-danger">Error fetching repositories</p>';
    }
  };

  fetchData();
});
