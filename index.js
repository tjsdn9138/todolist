const input = document.querySelector('#todo-input')
const btn = document.querySelector('#add-btn')
const list = document.querySelector('#todo-list')
const count = document.querySelector('#todo-count')
const categoryFilter = document.querySelector('#category-filter')
const completedFilter = document.querySelector('#completed-filter')
const dateSort = document.querySelector('#date-sort')
const countBar = document.querySelector('#count-bar')
const title = document.querySelector('h1')
const themeLink = document.querySelector('#theme-css')

// xss 방지 함수
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// JSON.parse 시 발생 가능한 오류 해결 함수
function safeParseJSON(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || []
    }
    catch {
        return []
    }
}

// 날짜 유효성 검사 함수
function isValidDate(str) {
    if (!str) return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false

    const date = new Date(str)
    return !isNaN(date.getTime())
}

// 일퀘 체크 및 초기화 함수
function resetDailyTodos() {
    const today = new Date().toISOString().slice(0, 10)

    completedTodos = completedTodos.filter(function(todo) {
        if (todo.category === '일퀘' && todo.completedDate !== today) {
            delete todo.completedDate
            incompletedTodos.unshift(todo)

            return false
        }

        return true
    })

    localStorage.setItem('incompletedTodos', JSON.stringify(incompletedTodos))
    localStorage.setItem('completedTodos', JSON.stringify(completedTodos))
}

let incompletedTodos = safeParseJSON('incompletedTodos')
let completedTodos = safeParseJSON('completedTodos')

// 랜더링 함수
function render() {
    if (currentTheme === 'hacker') {
        renderHacker()
    }
    else if (currentTheme === 'boj') {
        renderBOJ()
    }
}

// 해킹 테마 랜더링 함수
let countTimer = null
let barTimer = null
function renderHacker() {
    const category = categoryFilter.value
    const completed = completedFilter.value
    const sort = dateSort.value

    // 필터가 적용된 배열 생성
    const filteredIncomplete = incompletedTodos
        .filter(function (todo) {
            return category === '전체' || todo.category === category
        })

    const filteredComplete = completedTodos
        .filter(function (todo) {
            return category === '전체' || todo.category === category
        })

    // 날짜 정렬 적용(미완료만)
    if (sort !== 'default') {
        filteredIncomplete.sort(function (a, b) {
            if (!a.deadline) return -1
            if (!b.deadline) return 1
            if (sort === 'asc') return a.deadline > b.deadline ? 1 : -1
            if (sort === 'desc') return a.deadline < b.deadline ? 1 : -1
        })
    }

    // 완료 필터에 따라 보여줄 목록 결정
    let showIncomplete = completed !== '완료'
    let showComplete = completed !== '미완료'

    // 타이핑 애니메이션 함수
    function typeText(element, text, timer, callback, speed = 40) {
        if (timer) clearInterval(timer)

        element.innerHTML = ''
        let i = 0
        timer = setInterval(function () {
            element.innerHTML += text[i]
            i++
            if (i >= text.length) {
                clearInterval(timer)
                timer = null
                if (callback) callback()
            }
        }, speed)

        return timer
    }

    // 완료율 게이지 바
    const BAR_LENGTH = Math.min(35, Math.floor((window.innerWidth - 250) / 14))
    const completedCount = showComplete ? filteredComplete.length : 0
    const incompletedCount = showIncomplete ? filteredIncomplete.length : 0
    const total = completedCount + incompletedCount
    const filled = total === 0 ? BAR_LENGTH : Math.round((completedCount / total) * BAR_LENGTH)

    // 투두 완료 갯수(미완료만)
    if (incompletedCount == 0) {
        countTimer = typeText(count, "할 일이 있을까요?", countTimer, function () {
            barTimer = typeText(countBar, '█'.repeat(filled) + '░'.repeat(BAR_LENGTH - filled), barTimer, null, 20)
        })
        countBar.innerHTML = ''
    }
    else {
        countTimer = typeText(count, "할 일이 " + incompletedCount + "개나 남았어요", countTimer, function () {
            barTimer = typeText(countBar, '█'.repeat(filled) + '░'.repeat(BAR_LENGTH - filled), barTimer, null, 20)
        })
        countBar.innerHTML = ''
    }

    // 투두 리스트 갱신
    list.innerHTML = ''

    // 미완료 투두      
    if (showIncomplete) {
        filteredIncomplete.forEach(function (todo, index) {
            // 기간이 지난 투두 확인
            const isOverdue = todo.deadline && todo.deadline < new Date().toISOString().slice(0, 10)

            list.innerHTML += `
        <li class="todo-item ${isOverdue ? 'overdue' : ''}" data-type="incomplete" data-index="${index}">
            ${category === '전체' && sort === 'default' ? `
            <button class="up-btn" data-type="incomplete" data-index="${index}">▲</button>
            <button class="down-btn" data-type="incomplete" data-index="${index}">▼</button>
            ` : ''}
            <span class="todo-text">
            <span>[${escapeHTML(todo.category)}]</span>
            ${escapeHTML(todo.text)}
            <span>${todo.deadline ? '(~' + escapeHTML(todo.deadline) + ')' : ''}</span>
            </span>
            <button class="delete-btn" data-type="incomplete" data-index="${index}">X</button>
        </li>
        `
        })
    }

    // 완료 투두
    if (showComplete) {
        filteredComplete.forEach(function (todo, index) {
            list.innerHTML += `
        <li class="todo-item completed" data-type="complete" data-index="${index}">
            ${category === '전체' ? `
            <button class="up-btn" data-type="complete" data-index="${index}">▲</button>
            <button class="down-btn" data-type="complete" data-index="${index}">▼</button>
            ` : ''}
            <span class="todo-text">
            <span>[${escapeHTML(todo.category)}]</span>
            ${escapeHTML(todo.text)}
            <span>${todo.deadline ? '(~' + escapeHTML(todo.deadline) + ')' : ''}</span>
            </span>
            <button class="delete-btn" data-type="complete" data-index="${index}">X</button>
        </li>
        `
        })
    }
}

// 백준 테마 채점 결과 확인 함수
function getJudgeResult(todo, isCompleted) {
    const today = new Date().toISOString().slice(0, 10)
    if (isCompleted) return { text: '맞았습니다!!', cls: 'result-ac' }
    if (todo.deadline && todo.deadline < today) return { text: '시간 초과', cls: 'result-tle' }
    if (/[a-zA-Z]/.test(todo.text) || /[!@#$%^&*(),.?":{}|<>]/.test(todo.text)) return { text: '컴파일 에러', cls: 'result-ce' }
    return { text: '기다리는 중', cls: 'result-wait' }
}

// 백준 테마 제출 시간 계산 함수
function timeAgo(timestamp) {
    if (!timestamp) return '-'

    const diff = Math.floor((Date.now() - timestamp) / 1000 / 60)

    if (diff < 1) return '방금 전'
    if (diff < 60) return diff + '분 전'
    if (diff < 1440) return Math.floor(diff / 60) + '시간 전'
    if (diff < 43200) return Math.floor(diff / 1440) + '일 전'
    if (diff < 525600) return Math.floor(diff / 43200) + '달 전'
    return Math.floor(diff / 525600) + '년 전'
}

// 백준 테마 카테고리 -> 티어
const categoryTier = {
    '기타':  { label: 'Bronze',   icon: './icons/bronze.png' },
    '일퀘':  { label: 'Silver',   icon: './icons/silver.png' },
    '과제':  { label: 'Gold',     icon: './icons/gold.png' },
    '공부':  { label: 'Platinum', icon: './icons/platinum.png' },
    '개발':  { label: 'Diamond',  icon: './icons/diamond.png' },
}

// 백준 테마 랜더링 함수
function renderBOJ() {
    const category = categoryFilter.value
    const completed = completedFilter.value
    const sort = dateSort.value
    const today = new Date().toISOString().slice(0, 10)

    // 필터 배열 생성
    const filteredIncomplete = incompletedTodos.filter(t => category === '전체' || t.category === category)
    const filteredComplete = completedTodos.filter(t => category === '전체' || t.category === category)

    // 미완료 투두 정렬
    if (sort !== 'default') {
        filteredIncomplete.sort(function(a, b) {
            if (!a.deadline) return -1
            if (!b.deadline) return 1
            return sort === 'asc' ? (a.deadline > b.deadline ? 1 : -1) : (a.deadline < b.deadline ? 1 : -1)
        })
    }

    // 완료 필터에 따른 배열 표시
    const showIncomplete = completed !== '완료'
    const showComplete = completed !== '미완료'

    // 투두 리스트 갱신
    let rows = ''

    if (showIncomplete) {
        filteredIncomplete.forEach(function(todo, index) {
            const result = getJudgeResult(todo, false)
            const tier = categoryTier[todo.category] || categoryTier['기타']
            rows += `
                <tr data-type="incomplete" data-index="${index}">
                    <td class="up-btn" data-type="incomplete" data-index="${index}">
                        <img src="./icons/ruby.png" width="12" title="ruby">
                        <span class="boj-id">tjsdn9138</span><br>
                    </td>
                    <td>
                        <img src="${tier.icon}" width="12" title="${tier.label}">
                        <span class="todo-text">${escapeHTML(todo.text)}</span>
                    </td>
                    <td class="${result.cls}">
                        ${result.text}
                    </td>
                    <td class="delete-btn" data-type="incomplete" data-index="${index}">
                        ${Math.floor(Math.random() * 9999)} <span class="boj-unit">KB</span>
                    </td>
                    <td>
                        ${todo.deadline ? escapeHTML(todo.deadline.replaceAll('-', '').slice(2)) : '0'} <span class="boj-unit">ms</span>
                    </td>
                    <td>
                        <span class="boj-lang">C++17</span>
                        /
                        <button class="edit-btn" data-type="incomplete" data-index="${index}">수정</button>
                    </td>
                    <td class="down-btn" data-type="incomplete" data-index="${index}">
                        ${todo.text.length * 43} <span class="boj-unit">B</span>
                    </td>
                    <td>
                        <span class="boj-time" title="${new Date(todo.date).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        })}">${timeAgo(todo.date)}</span>
                    </td>
                </tr>
            `
        })
    }

    if (showComplete) {
        filteredComplete.forEach(function(todo, index) {
            const result = getJudgeResult(todo, true)
            const tier = categoryTier[todo.category] || categoryTier['기타']
            rows += `
                <tr class="boj-completed-row" data-type="complete" data-index="${index}">
                    <td class="up-btn" data-type="complete" data-index="${index}">
                        <img src="./icons/ruby.png" width="12" title="ruby">
                        <span class="boj-id">tjsdn9138</span><br>
                    </td>
                    <td>
                        <img src="${tier.icon}" width="12" title="${tier.label}">
                        <span class="todo-text">${escapeHTML(todo.text)}</span>
                    </td>
                    <td class="${result.cls}">
                        ${result.text}
                    </td>
                    <td class="delete-btn" data-type="complete" data-index="${index}">
                        ${Math.floor(Math.random() * 9999)} <span class="boj-unit">KB</span>
                    </td>
                    <td>
                        ${todo.deadline ? escapeHTML(todo.deadline.replaceAll('-', '').slice(2)) : '0'} <span class="boj-unit">ms</span>
                    </td>
                    <td>
                        <span class="boj-lang">C++17</span>
                        /
                        <button class="edit-btn" data-type="complete" data-index="${index}">수정</button>
                    </td>
                    <td class="down-btn" data-type="complete" data-index="${index}">
                        ${todo.text.length * 43} <span class="boj-unit">B</span>
                    </td>
                    <td>
                        <span class="boj-time" title="${new Date(todo.date).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        })}">${timeAgo(todo.date)}</span>
                    </td>
                </tr>
            `
        })
    }

    list.innerHTML = `
        <table class="boj-table">
            <thead>
                <tr>
                    <th>아이디</th>
                    <th>문제</th>
                    <th>결과</th>
                    <th>메모리</th>
                    <th>시간</th>
                    <th>언어</th>
                    <th>코드 길이</th>
                    <th>제출한 시간</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `
}

// 투두 추가 함수
function addTodo() {
    const category = document.querySelector('#category-select').value
    const date = document.querySelector('#deadline-input').value
    const text = input.value

    if (!isValidDate(date)) return
    if (text === '') return

    incompletedTodos.push({
        text: text,
        category: category,
        deadline: date,
        // 백준 테마 날짜 계산용
        date: Date.now()
    })

    localStorage.setItem('incompletedTodos', JSON.stringify(incompletedTodos))
    render()

    // 투두 추가 시 애니메이션 효과
    input.classList.add('flash')
    setTimeout(function () {
        input.classList.remove('flash')
    }, 400)

    input.value = ''
    document.querySelector('#deadline-input').value = ''
}

// 추가 버튼 클릭
btn.addEventListener('click', function () {
    addTodo()
})

// 투두 입력 시 엔터 클릭
input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        addTodo()
    }
})

// 투두 수정 저장 함수
function saveEdit(editInput, targetArray, liIndex) {
    const newText = editInput.value

    if (newText === '') return

    targetArray[liIndex].text = newText
    localStorage.setItem('incompletedTodos', JSON.stringify(incompletedTodos))
    localStorage.setItem('completedTodos', JSON.stringify(completedTodos))
    render()
}

// 더블 클릭 시 투두 내용 수정
let clickTimer = null
list.addEventListener('dblclick', function (e) {
    if (clickTimer) {
        clearTimeout(clickTimer)
        clickTimer = null
    }

    const todoText = e.target.closest('.todo-text')
    if (!todoText) return

    const li = e.target.closest('li')
    const liType = li.dataset.type
    const liIndex = parseInt(li.dataset.index)

    const targetArray = liType === 'complete' ? completedTodos : incompletedTodos
    const currentText = targetArray[liIndex].text

    todoText.innerHTML = `<input class="edit-input" value="${escapeHTML(currentText)}">`
    const editInput = todoText.querySelector('.edit-input')
    editInput.focus()
    editInput.setSelectionRange(editInput.value.length, editInput.value.length)

    let isSaved = false

    editInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            isSaved = true
            saveEdit(editInput, targetArray, liIndex)
        }
    })

    editInput.addEventListener('blur', function () {
        if (isSaved === false) saveEdit(editInput, targetArray, liIndex)
    })
})

// 투두 클릭
let isAnimating = false
list.addEventListener('click', function (e) {
    if (isAnimating) return

    const upBtn = e.target.closest('.up-btn')
    const downBtn = e.target.closest('.down-btn')
    const deleteBtn = e.target.closest('.delete-btn')
    const editBtn = e.target.closest('.edit-btn')
    const li = e.target.closest('li') || e.target.closest('tr')
    const liType = li ? li.dataset.type : null
    const liIndex = li ? parseInt(li.dataset.index) : null

    // 더블 클릭 처리
    if (clickTimer) {
        clearTimeout(clickTimer)
        clickTimer = null

        return
    }

    // 투두 수정
    if (editBtn) {
        const index = parseInt(editBtn.dataset.index)
        const type = editBtn.dataset.type
        const targetArray = type === 'complete' ? completedTodos : incompletedTodos

        const todoText = editBtn.closest('tr').querySelector('.todo-text')
        const currentText = targetArray[index].text

        todoText.innerHTML = `<input class="edit-input" value="${escapeHTML(currentText)}">`
        const editInput = todoText.querySelector('.edit-input')
        editInput.focus()
        editInput.setSelectionRange(editInput.value.length, editInput.value.length)

        let isSaved = false

        editInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                isSaved = true
                saveEdit(editInput, targetArray, index)
            }
        })

        editInput.addEventListener('blur', function() {
            if (!isSaved) saveEdit(editInput, targetArray, index)
        })

        return
    }

    // 투두 삭제
    if (deleteBtn) {
        const index = parseInt(deleteBtn.dataset.index)
        const type = deleteBtn.dataset.type
        const targetArray = type === 'complete' ? completedTodos : incompletedTodos

        li.classList.add('removing')

        isAnimating = true
        setTimeout(function () {
            targetArray.splice(index, 1)
            localStorage.setItem('incompletedTodos', JSON.stringify(incompletedTodos))
            localStorage.setItem('completedTodos', JSON.stringify(completedTodos))
            isAnimating = false
            render()
        }, 500)

        return
    }

    // 투두 위로 올리기
    if (upBtn) {
        const canMove = categoryFilter.value === '전체' && dateSort.value === 'default'
        if (!canMove) return
        
        const index = parseInt(upBtn.dataset.index)
        const type = upBtn.dataset.type
        const targetArray = type === 'complete' ? completedTodos : incompletedTodos

        if (index == 0) return

        li.classList.add('completing')

        isAnimating = true
        setTimeout(function () {
            li.classList.remove('completing')
                ;[targetArray[index], targetArray[index - 1]] = [targetArray[index - 1], targetArray[index]]
            localStorage.setItem('incompletedTodos', JSON.stringify(incompletedTodos))
            localStorage.setItem('completedTodos', JSON.stringify(completedTodos))
            isAnimating = false
            render()
        }, 400)

        return
    }

    // 투두 아래로 내리기
    if (downBtn) {
        const canMove = categoryFilter.value === '전체' && dateSort.value === 'default'
        if (!canMove) return

        const index = parseInt(downBtn.dataset.index)
        const type = downBtn.dataset.type
        const targetArray = type === 'complete' ? completedTodos : incompletedTodos

        if (index == targetArray.length - 1) return

        li.classList.add('completing')

        isAnimating = true
        setTimeout(function () {
            li.classList.remove('completing')
                ;[targetArray[index], targetArray[index + 1]] = [targetArray[index + 1], targetArray[index]]
            localStorage.setItem('incompletedTodos', JSON.stringify(incompletedTodos))
            localStorage.setItem('completedTodos', JSON.stringify(completedTodos))
            isAnimating = false
            render()
        }, 400)

        return
    }

    // 더블 클릭 체크
    clickTimer = setTimeout(function () {
        clickTimer = null
        // 투두 완료
        if ((li && li.classList.contains('todo-item')) || e.target.closest('.todo-text')) {
            if (li.querySelector('.edit-input')) return

            li.classList.add('completing')

            isAnimating = true
            setTimeout(function () {
                if (liType === 'incomplete') {
                    const item = incompletedTodos.splice(liIndex, 1)[0]
                    item.completedDate = new Date().toISOString().slice(0, 10)
                    completedTodos.push(item)
                }
                else {
                    const item = completedTodos.splice(liIndex, 1)[0]
                    delete item.completedDate
                    incompletedTodos.push(item)
                }
                localStorage.setItem('incompletedTodos', JSON.stringify(incompletedTodos))
                localStorage.setItem('completedTodos', JSON.stringify(completedTodos))
                isAnimating = false
                render()
            }, 400)
        }
    }, 250)
})

// 카테고리 필터 변경 시 갱신
categoryFilter.addEventListener('change', function () {
    render()
})

// 완료 필터 변경 시 갱신
completedFilter.addEventListener('change', function () {
    render()
})

// 날짜 정렬 변경 시 갱신
dateSort.addEventListener('change', function () {
    render()
})

// 포그라운드 -> 백그라운드 변경 시 갱신
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        resetDailyTodos()
        render()
    }
})

// 테마
const themes = ['hacker', 'boj']
const themeTitle = {
    hacker: '/* TodoList */<span="cursor">_</span>',
    boj: 'TODOL<span style="color:#3c82cc;font-style:italic;">{</span>'
        + ' ST' +
        '<span style="color:#3c82cc;font-style:italic;">}</span>'
}
let currentTheme = localStorage.getItem('theme') || 'hacker'

// 테마 적용 함수
function applyTheme(theme) {
    themeLink.href = theme + '.css'
    title.innerHTML = themeTitle[theme]

    localStorage.setItem('theme', theme)
    render()
}

// 제목 더블 클릭 시 테마 변경(순환)
title.addEventListener('dblclick', function() {
    const idx = themes.indexOf(currentTheme)
    currentTheme = themes[(idx + 1) % themes.length]
    applyTheme(currentTheme)
})

// 앱 실행 시 화면 출력
resetDailyTodos()
applyTheme(currentTheme)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
}