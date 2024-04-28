
export const getPosters = async (supabase) => {
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    // const formatDate = (date) => {
    //     return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    // };

    const { data, error } = await supabase
        .from('poster')
        .select('poster_id, title, date, created_by, content, location, start_time, end_time, user_id, is_reported, image');
        // .gte('date', formatDate(today))
        // .lte('date', formatDate(oneWeekFromNow));

    if (error) {
        throw new Error(`Supabase error: ${error.message}`);
    }

    const filteredData = data.filter(poster => poster.is_reported !== "True");

    return filteredData;
};

export const getLikes = async (posterIds, supabase) => {
    const { data, error } = await supabase
        .from('likes')
        .select('poster_id, user_id')
        .in('poster_id', posterIds);

    if (error) {
        throw new Error(`Supabase error: ${error.message}`);
    }

    return data;
};