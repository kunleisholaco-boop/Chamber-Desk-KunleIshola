import React from 'react';
import { X } from 'lucide-react';

const EditTaskModal = ({
    isOpen,
    onClose,
    onSubmit,
    formData,
    setFormData,
    task,
    cases,
    availableForAssignment,
    availableForCollaboration,
    toggleAssignee,
    toggleCollaborator,
    isLoading = false,
    isSaving = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-900">Edit Task</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isSaving}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                        <p className="text-gray-600">Loading task data...</p>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                disabled={isSaving}
                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                disabled={isSaving}
                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                disabled={isSaving}
                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                {['Low', 'Medium', 'High'].map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Case Dropdown */}
                        {task.case && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Related Case</label>
                                <select
                                    value={formData.caseId || ''}
                                    onChange={e => setFormData({ ...formData, caseId: e.target.value })}
                                    disabled={isSaving}
                                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select a case...</option>
                                    {cases.map(c => (
                                        <option key={c._id} value={c._id}>{c.caseTitle}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Assigned To - Multiple Selection */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                            <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2">
                                {availableForAssignment.map(user => (
                                    <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.assignedTo?.includes(user._id) || false}
                                            onChange={() => toggleAssignee(user._id)}
                                            disabled={isSaving}
                                            className="rounded text-orange-600 focus:ring-orange-500 disabled:cursor-not-allowed"
                                        />
                                        <span className="text-sm text-gray-700">{user.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Collaborators */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Collaborators</label>
                            <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2">
                                {availableForCollaboration.map(user => (
                                    <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.collaborators?.includes(user._id) || false}
                                            onChange={() => toggleCollaborator(user._id)}
                                            disabled={isSaving}
                                            className="rounded text-orange-600 focus:ring-orange-500 disabled:cursor-not-allowed"
                                        />
                                        <span className="text-sm text-gray-700">{user.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 col-span-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    id="edit-start-date"
                                    type="date"
                                    value={formData.startDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    onClick={(e) => e.target.showPicker?.()}
                                    disabled={isSaving}
                                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    id="edit-end-date"
                                    type="date"
                                    value={formData.endDate}
                                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    onClick={(e) => e.target.showPicker?.()}
                                    disabled={isSaving}
                                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditTaskModal;
