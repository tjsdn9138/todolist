const input = document.querySelector('#todo-input')
const btn = document.querySelector('#add-btn')
const list = document.querySelector('#todo-list')
const count = document.querySelector('#todo-count')
const categoryFilter = document.querySelector('#category-filter')
const completedFilter = document.querySelector('#completed-filter')
const dateSort = document.querySelector('#date-sort')
const countBar = document.querySelector('#count-bar')

// xss 대비 방어 함수
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

let incompletedTodos = safeParseJSON('incompletedTodos')
let completedTodos = safeParseJSON('completedTodos')

// 변경점 갱신 함수
let countTimer = null
let barTimer = null
function render() {
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

// 투두 추가
function addTodo() {
    const category = document.querySelector('#category-select').value
    const date = document.querySelector('#deadline-input').value
    const text = input.value

    if (!isValidDate(date)) return
    if (text === '') return

    incompletedTodos.push({
        text: text, category: category, deadline: date
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

    const index = parseInt(e.target.dataset.index)
    const type = e.target.dataset.type
    const li = e.target.closest('li')
    const liType = li ? li.dataset.type : null
    const liIndex = li ? parseInt(li.dataset.index) : null

    const targetArray = type === 'complete' ? completedTodos : incompletedTodos

    // 더블 클릭 처리
    if (clickTimer) {
        clearTimeout(clickTimer)
        clickTimer = null

        return
    }

    // 투두 삭제
    if (e.target.classList.contains('delete-btn')) {
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
    if (e.target.classList.contains('up-btn')) {
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
    if (e.target.classList.contains('down-btn')) {
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
        if (li && li.classList.contains('todo-item')) {
            if (li.querySelector('.edit-input')) return

            li.classList.add('completing')

            isAnimating = true
            setTimeout(function () {
                if (liType === 'incomplete') {
                    const item = incompletedTodos.splice(liIndex, 1)[0]
                    completedTodos.push(item)
                } else {
                    const item = completedTodos.splice(liIndex, 1)[0]
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

render()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
}