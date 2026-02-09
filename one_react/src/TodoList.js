import React from 'react';

const TodoList = ({ selectedDate, todos, onDataUpdate }) => {
    const toggleTodoCompletion = async (todoId, currentStatus) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/todos/${todoId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus }),
            });
            if (!res.ok) throw new Error('Failed to update todo status');
            onDataUpdate(); // Refetch data
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    };

    const deleteTodo = async (todoId) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/todos/${todoId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete todo');
            onDataUpdate(); // Refetch data
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    return (
        <div id="todolist-list" className="section-content">
            {todos.length === 0 ? (
                <p>등록된 투두리스트가 없습니다.</p>
            ) : (
                <ul>
                    {todos.map(todo => (
                        <li key={todo.id} className={todo.completed ? 'completed' : ''}>
                            <input 
                                type="checkbox" 
                                checked={todo.completed} 
                                onChange={() => toggleTodoCompletion(todo.id, todo.completed)} 
                            />
                            <span>{todo.title}</span>
                            <button className="delete-item-btn" onClick={() => deleteTodo(todo.id)}>×</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TodoList;
