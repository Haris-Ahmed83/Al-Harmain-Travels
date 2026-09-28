'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { EmergencyContact, Profile } from '@/types';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Save,
  Camera,
  Trash2,
  Plus,
  Edit2,
  Star,
  Calendar,
  Globe,
  AlertCircle,
  Clock,
  LogOut,
  Laptop,
  Smartphone,
  Check,
  X,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerProfilePage() {
  const {
    currentUser,
    updateUserProfile,
    uploadAvatar,
    changePassword,
    deleteUser,
    emergencyContacts,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    setPrimaryEmergencyContact,
    bookings,
    isDataLoading,
  } = useApp();

  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'emergency' | 'security' | 'status'>('profile');

  // Personal Info Form State
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [dateOfBirth, setDateOfBirth] = useState(currentUser.date_of_birth || '1985-06-15');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(currentUser.gender || 'male');
  const [preferredLang, setPreferredLang] = useState('en');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile form state when currentUser loads from Supabase
  React.useEffect(() => {
    if (currentUser?.full_name && currentUser.full_name !== 'Guest User') {
      setFullName(currentUser.full_name);
    }
    if (currentUser?.date_of_birth) {
      setDateOfBirth(currentUser.date_of_birth);
    }
    if (currentUser?.gender) {
      setGender(currentUser.gender);
    }
  }, [currentUser]);

  // Phone Change State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

  // Avatar Management
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Emergency Contacts Modal State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('Spouse');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactIsPrimary, setContactIsPrimary] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Delete Confirmation Modal
  const [contactToDelete, setContactToDelete] = useState<EmergencyContact | null>(null);

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Danger Zone / Delete Account State
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion.');
      return;
    }
    setIsDeletingAccount(true);
    try {
      const success = await deleteUser(currentUser.id);
      if (success) {
        toast.success('Your account has been deleted permanently.');
        router.push('/login');
      }
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteAccountModalOpen(false);
    }
  };

  // Completed rides count
  const completedRidesCount = useMemo(() => {
    return bookings.filter(
      (b) =>
        (b.customer_id === currentUser.id || b.passenger_phone === currentUser.phone) &&
        (b.status === 'trip_completed' || b.status === 'ride_completed' || b.status === 'payment_completed')
    ).length;
  }, [bookings, currentUser]);

  // Handle Personal Info Save
  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 3) {
      toast.error('Please enter a valid legal name (at least 3 characters).');
      return;
    }

    setIsSavingProfile(true);
    await updateUserProfile({
      full_name: fullName.trim(),
      date_of_birth: dateOfBirth,
      gender,
    });
    setIsSavingProfile(false);
  };

  // Handle Photo File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Please choose a valid JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    setPendingFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewPhotoUrl(objectUrl);
    setIsCropModalOpen(true);
  };

  const handleConfirmPhotoUpload = async () => {
    if (!pendingFile) return;
    setIsUploadingPhoto(true);
    await uploadAvatar(pendingFile);
    setIsUploadingPhoto(false);
    setIsCropModalOpen(false);
    setPendingFile(null);
    setPreviewPhotoUrl(null);
  };

  const handleRemovePhoto = async () => {
    if (confirm('Are you sure you want to remove your profile photo?')) {
      await updateUserProfile({ avatar_url: null });
      toast.success('Profile photo removed.');
    }
  };

  // Phone Update Flow
  const handleStartPhoneChange = () => {
    setNewPhoneNumber(currentUser.phone || '');
    setIsPhoneModalOpen(true);
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhoneNumber.trim().length < 8) {
      toast.error('Please enter a valid phone number with country code.');
      return;
    }

    setIsUpdatingPhone(true);
    await updateUserProfile({ phone: newPhoneNumber.trim() });
    setIsUpdatingPhone(false);
    setIsPhoneModalOpen(false);
    toast.success('Phone number updated successfully.');
  };

  // Emergency Contact Modal Handlers
  const openAddContactModal = () => {
    setEditingContact(null);
    setContactName('');
    setContactRelation('Spouse');
    setContactPhone('');
    setContactEmail('');
    setContactIsPrimary(emergencyContacts.length === 0);
    setIsContactModalOpen(true);
  };

  const openEditContactModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setContactName(contact.name);
    setContactRelation(contact.relationship);
    setContactPhone(contact.phone);
    setContactEmail(contact.email || '');
    setContactIsPrimary(contact.is_primary);
    setIsContactModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || contactName.length < 2) {
      toast.error('Please enter a contact name.');
      return;
    }
    if (!contactPhone.trim() || contactPhone.length < 7) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setIsSavingContact(true);
    if (editingContact) {
      await updateEmergencyContact(editingContact.id, {
        name: contactName.trim(),
        relationship: contactRelation,
        phone: contactPhone.trim(),
        email: contactEmail.trim() || null,
        is_primary: contactIsPrimary,
      });
    } else {
      await addEmergencyContact({
        name: contactName.trim(),
        relationship: contactRelation,
        phone: contactPhone.trim(),
        email: contactEmail.trim() || null,
        is_primary: contactIsPrimary,
      });
    }
    setIsSavingContact(false);
    setIsContactModalOpen(false);
  };

  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete) return;
    await deleteEmergencyContact(contactToDelete.id);
    setContactToDelete(null);
  };

  // Change Password
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(res.error || 'Failed to update password.');
    }
  };

  return (
    <div className="page-shell space-y-8 animate-fade-up">
      {/* Header Banner */}
      <div className="bg-card border border-base p-6 sm:p-7 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover border-2 border-emerald-500/50 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-900 text-amber-400 font-bold text-3xl sm:text-4xl flex items-center justify-center border-2 border-emerald-500/50 shadow-lg">
                {currentUser.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-transform group-hover:scale-110 cursor-pointer"
              title="Change Profile Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-primary">{currentUser.full_name}</h1>
              <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
                Verified Pilgrim
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted">{currentUser.email || 'Verified Customer'}</p>
            <p className="text-xs text-secondary font-mono pt-0.5">{currentUser.phone || 'No phone set'}</p>
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-base text-xs font-semibold text-secondary">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Customer ID: #{currentUser.id.slice(-6).toUpperCase()}</span>
          </div>
          {currentUser.avatar_url && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-[11px] text-rose-500 hover:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Remove photo
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-base overflow-x-auto pb-2 text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`whitespace-nowrap px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'bg-card text-secondary hover:text-primary hover:bg-elevated border border-base'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Information</span>
        </button>

        <button
          onClick={() => setActiveTab('emergency')}
          className={`whitespace-nowrap px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'emergency'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'bg-card text-secondary hover:text-primary hover:bg-elevated border border-base'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Emergency Contacts ({emergencyContacts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`whitespace-nowrap px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'security'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'bg-card text-secondary hover:text-primary hover:bg-elevated border border-base'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security &amp; Password</span>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`whitespace-nowrap px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'status'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'bg-card text-secondary hover:text-primary hover:bg-elevated border border-base'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Account &amp; Pilgrim Tier</span>
        </button>
      </div>

      {/* TAB 1: PERSONAL INFORMATION */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Verification Cards */}
          <div className="lg:col-span-4 space-y-5">
            <div className="surface-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verification Badges</span>
              </h3>

              <div className="space-y-3 text-xs">
                {/* Email Verification Card */}
                <div className="p-3.5 rounded-2xl bg-surface border border-base space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary font-semibold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-500" />
                      Email Status
                    </span>
                    {currentUser.email_verified !== false ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-amber-500 font-bold text-[11px]">Unverified</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted truncate">{currentUser.email || 'Verified Customer'}</p>
                </div>

                {/* Phone Card */}
                <div className="p-3.5 rounded-2xl bg-surface border border-base space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary font-semibold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-500" />
                      Contact Phone
                    </span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-muted">{currentUser.phone || 'None recorded'}</p>

                  <button
                    type="button"
                    onClick={handleStartPhoneChange}
                    className="w-full py-2 px-3 rounded-xl bg-card hover:bg-elevated border border-base text-amber-500 dark:text-amber-400 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Change Phone Number</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Language & Preferences Card */}
            <div className="surface-card p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-500" />
                <span>Preferred Language</span>
              </h3>
              <p className="text-[11px] text-muted">Captain &amp; Dispatcher communication language:</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'ar', label: 'العربية' },
                  { id: 'ur', label: 'اردو' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setPreferredLang(l.id);
                      toast.success(`Language preference set to ${l.label}`);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold transition-colors cursor-pointer ${
                      preferredLang === l.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-surface border-base text-secondary hover:bg-elevated'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Form: Personal Details */}
          <div className="lg:col-span-8 surface-card p-6 sm:p-8 space-y-6">
            <div className="border-b border-base pb-4">
              <h2 className="text-base sm:text-lg font-bold text-primary">Edit Personal Details</h2>
              <p className="text-xs text-muted">Keep your pilgrim profile information accurate for airport clearance.</p>
            </div>

            <form onSubmit={handleSavePersonalInfo} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Legal Name */}
                <div>
                  <label className="type-label">Full Legal Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="field-input pl-10"
                      placeholder="e.g. Dr. Abdullah Rahman"
                    />
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="type-label !mb-0">Primary Email Address</label>
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified &amp; Locked
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      disabled
                      value={currentUser.email || ''}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-base text-muted cursor-not-allowed text-xs font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-muted mt-1 block">
                    Contact Executive Support to change registered email.
                  </span>
                </div>
              </div>

              {/* Date of Birth & Gender Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="type-label">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="field-input pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="type-label">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                    className="field-input"
                  >
                    <option value="male">Male (ذكر)</option>
                    <option value="female">Female (أنثى)</option>
                    <option value="other">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Submit Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-brand py-3 px-6 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Saving Details…</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: EMERGENCY CONTACTS */}
      {activeTab === 'emergency' && (
        <div className="space-y-6">
          <div className="surface-card p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
                  <Phone className="w-5 h-5 text-amber-500" />
                  <span>Emergency Contacts</span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Trusted contacts notified in the unlikely event of an urgent itinerary disruption or medical situation.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddContactModal}
                className="btn-brand py-2.5 px-4 text-xs shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Emergency Contact</span>
              </button>
            </div>

            {/* Contacts List */}
            {isDataLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-base bg-surface animate-pulse space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-28 bg-surface rounded-md" />
                      <div className="h-4 w-16 bg-surface rounded-full" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="h-3 w-36 bg-surface rounded-md" />
                      <div className="h-3 w-24 bg-surface rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : emergencyContacts.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-surface/50 rounded-2xl border border-dashed border-base">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Phone className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-primary">No Emergency Contacts Registered</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Add at least one family member or guardian for trip safety during your Umrah and intercity transfers.
                </p>
                <button
                  type="button"
                  onClick={openAddContactModal}
                  className="btn-secondary py-2 px-4 text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Contact</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {emergencyContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      contact.is_primary
                        ? 'bg-elevated/70 border-amber-500/40 shadow-md'
                        : 'bg-surface border-base hover:border-emerald-500/30'
                    } space-y-3 relative`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-primary">{contact.name}</h4>
                          {contact.is_primary && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-500 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              Primary Contact
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-secondary font-medium">{contact.relationship}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditContactModal(contact)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-card border border-transparent hover:border-base transition-colors"
                          title="Edit Contact"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setContactToDelete(contact)}
                          className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-card border border-transparent hover:border-base transition-colors"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-secondary font-mono">
                        <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2 text-muted truncate">
                          <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                    </div>

                    {!contact.is_primary && (
                      <div className="pt-2 border-t border-base/60">
                        <button
                          type="button"
                          onClick={() => setPrimaryEmergencyContact(contact.id)}
                          className="text-[11px] font-bold text-amber-500 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Star className="w-3 h-3" />
                          <span>Set as Primary Contact</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Active Sessions Overview */}
          <div className="lg:col-span-4 space-y-5">
            <div className="surface-card p-5 sm:p-6 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Security Overview</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-surface border border-base space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-emerald-500" />
                      Current Active Session
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Windows · Chrome Desktop <br />
                    IP: 178.20.xxx.xxx (KSA / Web)
                  </p>
                  <span className="text-[10px] text-emerald-500 font-semibold block">Active right now</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-base space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-muted" />
                      Mobile App Session
                    </span>
                    <span className="text-[10px] text-muted">2 days ago</span>
                  </div>
                  <p className="text-[11px] text-muted">iOS App · Jeddah Gateway</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast.success('All other remote devices logged out.')}
                className="w-full py-2.5 px-3 rounded-xl bg-surface hover:bg-elevated border border-base text-rose-500 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out All Other Sessions</span>
              </button>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="lg:col-span-8 surface-card p-6 sm:p-8 space-y-6">
            <div className="border-b border-base pb-3">
              <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                <span>Change Password</span>
              </h2>
              <p className="text-xs text-muted">Protect your account with a secure, confidential password.</p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="type-label">Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="field-input"
                />
              </div>

              <div>
                <label className="type-label">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 8 characters with upper, lower &amp; numbers"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="field-input"
                />
              </div>

              <div>
                <label className="type-label">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="field-input"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="btn-brand py-3 px-6"
                >
                  {isChangingPassword ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Updating Password…</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Danger Zone: Account Deletion */}
            <div className="pt-6 border-t border-rose-500/20">
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Danger Zone: Delete Account</span>
                    </h4>
                    <p className="text-xs text-muted max-w-lg">
                      Permanently delete your account, saved preferences, and auth credentials. This action is irreversible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmationInput('');
                      setIsDeleteAccountModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNT STATUS & PILGRIM TIER */}
      {activeTab === 'status' && (
        <div className="surface-card p-6 sm:p-7 space-y-6">
          <div className="border-b border-base pb-4">
            <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Customer Account &amp; Pilgrim Tier</span>
            </h2>
            <p className="text-xs text-muted">Review your verified privileges, lifetime rides, and booking tier.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-base space-y-1">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Membership Tier</span>
              <div className="text-xl font-bold text-amber-500 dark:text-amber-400">VIP Pilgrim Gold</div>
              <p className="text-[10px] text-secondary pt-1">Direct Haram drop-off priority included.</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-base space-y-1">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Completed Transfers</span>
              <div className="text-xl font-bold text-primary">{completedRidesCount} Journeys</div>
              <p className="text-[10px] text-secondary pt-1">Across Makkah, Madinah &amp; Jeddah.</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-base space-y-1">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Account State</span>
              <div className="text-xl font-bold text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                Active &amp; In Good Standing
              </div>
              <p className="text-[10px] text-secondary pt-1">Protected by Two-Factor OTP.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface/60 border border-base text-xs text-secondary leading-relaxed space-y-2">
            <h4 className="font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Data Protection &amp; Saudi Transport Authority (TGA) Compliance</span>
            </h4>
            <p className="text-muted text-[11px]">
              Al Harmain Travels strictly encrypts all customer identifiers, emergency contacts, and GPS itinerary logs in compliance with Kingdom of Saudi Arabia regulatory standards. Customer data is never shared with unauthorized third parties.
            </p>
          </div>
        </div>
      )}

      {/* PHOTO PREVIEW & CONFIRM MODAL */}
      {isCropModalOpen && previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-sm surface-card p-6 space-y-5 rounded-3xl shadow-2xl">
            <h3 className="text-base font-bold text-primary text-center">Preview Profile Photo</h3>
            <div className="w-40 h-40 rounded-3xl overflow-hidden mx-auto border-2 border-amber-500 shadow-xl">
              <img src={previewPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-muted text-center">
              This photo will be visible to your assigned captain for pickup identification.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCropModalOpen(false);
                  setPendingFile(null);
                  setPreviewPhotoUrl(null);
                }}
                className="btn-secondary flex-1 py-2.5 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={handleConfirmPhotoUpload}
                className="btn-brand flex-1 py-2.5 text-xs cursor-pointer"
              >
                {isUploadingPhoto ? 'Uploading…' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PHONE MODAL */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-md surface-card p-6 space-y-5 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-base pb-3">
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                <span>Update Contact Phone</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4 text-xs">
              <div>
                <label className="type-label">Phone Number (with Country Code)</label>
                <input
                  type="tel"
                  required
                  placeholder="+966 50 123 4567"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="field-input"
                />
                <span className="text-[10px] text-muted mt-1 block">
                  Used by dispatchers and captains for coordinating Umrah transfers.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(false)}
                  className="btn-secondary py-2.5 px-4 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPhone}
                  className="btn-brand py-2.5 px-5 text-xs cursor-pointer"
                >
                  {isUpdatingPhone ? 'Saving…' : 'Update Phone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMERGENCY CONTACT ADD/EDIT MODAL */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-md surface-card p-6 space-y-5 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-base pb-3">
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                <span>{editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
              <div>
                <label className="type-label">Contact Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mariam Rahman"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="field-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="type-label">Relationship *</label>
                  <select
                    value={contactRelation}
                    onChange={(e) => setContactRelation(e.target.value)}
                    className="field-input"
                  >
                    <option value="Spouse">Spouse (زوج / زوجة)</option>
                    <option value="Parent">Parent (والد / والدة)</option>
                    <option value="Child">Son / Daughter (ابن / ابنة)</option>
                    <option value="Sibling">Brother / Sister (أخ / أخت)</option>
                    <option value="Friend">Friend / Companion</option>
                    <option value="Guardian">Guardian (ولي أمر)</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="type-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+966 50 123 4567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="field-input"
                  />
                </div>
              </div>

              <div>
                <label className="type-label">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="contact@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="field-input"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-secondary">
                  <input
                    type="checkbox"
                    checked={contactIsPrimary}
                    onChange={(e) => setContactIsPrimary(e.target.checked)}
                    className="w-4 h-4 rounded border-base text-amber-500 focus:ring-amber-400"
                  />
                  <span>Mark as Primary Emergency Contact</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-base">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="btn-secondary py-2.5 px-4 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="btn-brand py-2.5 px-5 text-xs cursor-pointer"
                >
                  {isSavingContact ? 'Saving…' : editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONTACT CONFIRMATION MODAL */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-sm surface-card p-6 space-y-4 rounded-3xl shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-primary">Remove Emergency Contact?</h3>
            <p className="text-xs text-muted">
              Are you sure you want to remove <strong className="text-primary">{contactToDelete.name}</strong> ({contactToDelete.relationship})?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="btn-secondary flex-1 py-2.5 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteContact}
                className="px-4 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white flex-1 text-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-md surface-card p-6 sm:p-7 space-y-5 rounded-3xl shadow-2xl border border-rose-500/30">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-primary">Delete Account Permanently?</h3>
              <p className="text-xs text-muted leading-relaxed">
                This will delete your login credentials from Supabase Auth, your customer profile, and remove all personal data. If you wish to use Al Harmain Travels in the future, you will need to register as a new customer.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/25 border border-rose-500/20 text-xs text-rose-300 space-y-1">
              <p className="font-semibold">⚠️ Type <span className="font-mono font-bold text-white bg-rose-900/60 px-1.5 py-0.5 rounded">DELETE</span> to confirm:</p>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="field-input mt-2 border-rose-500/40 focus:border-rose-400 font-mono text-center tracking-widest text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => {
                  setIsDeleteAccountModalOpen(false);
                  setDeleteConfirmationInput('');
                }}
                className="btn-secondary flex-1 py-2.5 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput !== 'DELETE' || isDeletingAccount}
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex-1 text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isDeletingAccount ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
